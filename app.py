from flask import Flask, render_template, url_for, session, redirect, g, request, send_from_directory
from flask_session import Session
from forms import registerForm, loginForm
from database import get_db, close_db
from werkzeug.security import generate_password_hash, check_password_hash

from datetime import date
import os
from functools import wraps
app = Flask(__name__)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config["SECRET_KEY"] = "the_key"
app.config["UPLOADED_IMAGES_DEST"] = 'static/images'

app.teardown_appcontext(close_db)

@app.before_request
def load_loggedin_user():
    g.user = session.get("userName", None)

def login_required(view):
    wraps(view)
    def wrapped_view(*args, **kwargs):
        if g.user is None:
            return(redirect(url_for("login", next = request.url)))
        return view(*args, **kwargs)
    return wrapped_view

@app.route("/")
def index():
    db = get_db()
    scores = db.execute("""SELECT userName, score FROM users
                          WHERE score > 0
                          ORDER BY score DESC;""").fetchall()
    
    return render_template('index.html', scores = scores)

@app.route("/register", methods = ["GET", "POST"])
def register():
    form = registerForm()
    if form.validate_on_submit():
        userName = form.userName.data
        password1 = form.passWord1.data
        password2 = form.passWord2.data
        db = get_db()
        conflict_user = db.execute(
            """SELECT * FROM users
                WHERE userName =?;""", (userName,)).fetchone()
        if conflict_user is not None:
            form.userName.errors.append("User name already taken")
        else:
            db.execute(
                """INSERT INTO users(userName, password, score)
                    VALUES(?, ?, ?);""",
                (userName, generate_password_hash(password1), 0))
            db.commit()
            next_page = request.args.get("next")
            if not next_page:
                next_page = url_for("login")
            return redirect(url_for("login"))
    return render_template("register.html", form = form)

@app.route("/login", methods = ["GET", "post"])
def login():
    form = loginForm()
    if form.validate_on_submit():
        userName = form.userName.data
        password = form.password.data
        db = get_db()
        user = db.execute(
            """SELECT * FROM users
                WHERE userName = ?;""", (userName,)).fetchone()
        if user is None:
            form.userName.errors.append("Username not found")
        elif not check_password_hash(user["password"],password):
            form.password.errors.append("Incorrect password")
        else:
            session.clear()
            session['userName'] = userName
            session['identity'] = "customer"
            next_page = request.args.get("next")
            if not next_page:
                next_page = url_for("zombieRun")
            return redirect(next_page)
    return render_template("login.html", form = form)

@app.route("/postScore", methods = ["post"])
def postScore():
    if 'userName' not in session:
        return "User not logged in", 403
    
    score = request.form.get("score")

    if score is None:
        return "Score not provided", 400
    
    score = int(score)
    
    db = get_db()
    try:
        existingScore = db.execute("""SELECT score FROM users WHERE userName = ?;""", (session["userName"],)).fetchone()
        if existingScore is None:
            return "User does not exist", 404

        current_score = int(existingScore['score'])

        if score > current_score:
            db.execute("""UPDATE users SET score = ? WHERE userName = ?;""", (score, session['userName']))
            db.commit()
            return "Score updated successfully", 200
    except:
        return "Database error", 500
    
    return "success", 200

@app.route("/zombieRun")
def zombieRun():
    return render_template("zombieRun.html")