from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, SubmitField, IntegerField, PasswordField, DateField, RadioField, FileField, DecimalField, TextAreaField, BooleanField
from wtforms.widgets import TextArea
from wtforms.validators import InputRequired, NumberRange, equal_to, ValidationError
from flask_uploads import UploadSet, IMAGES
from datetime import date
images = UploadSet('images', IMAGES)

def dateCheck(form,field):
    if field.data < date.today():
        raise ValidationError("The date cannot be in the past.")

def alphaOnly(form, field):
    lines = field.data.splitlines()
    for line in lines:
        for char in line:
            if not (char.isalpha() or char.isspace()):
                raise ValidationError('This field should only contain alphabetic characters.')


class registerForm(FlaskForm):
    userName = StringField("Username:", validators=[InputRequired()])
    passWord1 = PasswordField("Password:", validators=[InputRequired()])
    passWord2 = PasswordField("Confirm password", validators=[InputRequired(), equal_to("passWord1", message="Password must match")])
    Submit = SubmitField("Register")

class loginForm(FlaskForm):
    userName = StringField("Username:", validators=[InputRequired()])
    password = PasswordField("Password:", validators=[InputRequired()])
    Submit = SubmitField("Login")

