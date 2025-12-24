import time
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS
import os, re, mysql.connector, bcrypt, secrets, smtplib, json
from email.mime.text import MIMEText
from tensorflow.keras.models import load_model
import numpy as np
from PIL import Image
from werkzeug.utils import secure_filename
from datetime import date
from flask import session
from flask import Blueprint, request, jsonify, session
from datetime import datetime, date
import sqlite3
import google.generativeai as genai
from dotenv import load_dotenv

# -------------------- APP SETUP -------------------- #
app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)
app.secret_key = "supersecretkey"  # session encryption

# -------------------- MySQL config (users DB) -------------------- #
MYSQL_HOST = "localhost"
MYSQL_USER = "root"
MYSQL_PASSWORD = ""   # your MySQL password
MYSQL_DB = "profile_smart"

def get_db_conn():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        charset="utf8mb4"
    )

# -------------------- Helper -------------------- #
def is_valid_gmail(email):
    """Check if email is valid Gmail address"""
    return re.match(r"^[a-zA-Z0-9._%+-]+@gmail\.com$", email)

def send_verification_email(to_email, code):
    """Send verification email for registration"""
    sender = "mehedihasanlemon537@gmail.com"
    password = "odce wgfb rypy cjat"  # Gmail App Password
    msg = MIMEText(f"Welcome to AquaSmart!\n\nYour registration verification code is: {code}")
    msg["Subject"] = "AquaSmart Registration Verification"
    msg["From"] = sender
    msg["To"] = to_email
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, password)
        server.sendmail(sender, [to_email], msg.as_string())

def send_reset_email(to_email, code):
    """Send reset code email"""
    sender = "mehedihasanlemon537@gmail.com"
    password = "odce wgfb rypy cjat"  # Gmail App Password
    msg = MIMEText(f"Your AquaSmart password reset code is: {code}")
    msg["Subject"] = "AquaSmart Password Reset"
    msg["From"] = sender
    msg["To"] = to_email
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender, password)
        server.sendmail(sender, [to_email], msg.as_string())

# -------------------- Routes -------------------- #
@app.route("/")
def index():
    return render_template("login_register.html")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("index"))

    conn = get_db_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, first_name, last_name, gmail, phone, location, photo FROM users WHERE id=%s", (session["user_id"],))
    user = cur.fetchone()
    cur.close()
    conn.close()

    return render_template("dashboard.html", user=user)

# Navbar pages
def fetch_user():
    conn = get_profile_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, first_name, last_name, photo FROM users WHERE id=%s", (session["user_id"],))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return user


@app.route("/about")
def about():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("about.html",user=fetch_user())



@app.route("/classify")
def classify():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("classify.html",user=fetch_user())

@app.route("/chatbot")
def chatbot():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("chatbot.html",user=fetch_user())

@app.route("/daily_guide")
def daily_guide():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("daily_guide.html",user=fetch_user())

@app.route("/about_us")
def about_us():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("about_us.html",user=fetch_user())

@app.route("/profile")
def profile():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("profile.html",user=fetch_user())

@app.route("/waterquality")
def waterquality():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("waterquality.html",user=fetch_user())

# ---------------- Registration with verification ---------------- #
@app.route("/register", methods=["POST"])
def register():
    data = request.form
    fname, lname = data.get("first_name"), data.get("last_name")
    gmail, phone = data.get("gmail"), data.get("phone")
    location, password = data.get("location"), data.get("password")

    if not is_valid_gmail(gmail):
        return jsonify({"status": "error", "message": "Invalid Gmail"}), 400

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    code = secrets.token_hex(3).upper()

    conn = get_db_conn()
    cur = conn.cursor(dictionary=True)

    cur.execute("SELECT id FROM users WHERE gmail=%s OR phone=%s", (gmail, phone))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Gmail/Phone already registered"}), 400

    cur.execute("SELECT id FROM pending_users WHERE gmail=%s", (gmail,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Gmail already pending verification"}), 400

    cur.execute("""INSERT INTO pending_users 
        (first_name, last_name, gmail, phone, location, password_hash, verification_code, created_at) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())""",
        (fname, lname, gmail, phone, location, pw_hash, code))
    conn.commit()
    cur.close()
    conn.close()

    send_verification_email(gmail, code)
    return jsonify({"status": "ok", "message": "Verification code sent to Gmail"})

@app.route("/confirm_registration", methods=["POST"])
def confirm_registration():
    gmail = request.form.get("gmail")
    code = request.form.get("code")

    conn = get_db_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM pending_users WHERE gmail=%s AND verification_code=%s", (gmail, code))
    pending = cur.fetchone()

    if not pending:
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Invalid or expired code"}), 400

    cur2 = conn.cursor()
    cur2.execute("""INSERT INTO users (first_name, last_name, gmail, phone, location, password_hash)
                    VALUES (%s, %s, %s, %s, %s, %s)""",
                 (pending["first_name"], pending["last_name"], pending["gmail"], pending["phone"],
                  pending["location"], pending["password_hash"]))
    conn.commit()

    cur2.execute("DELETE FROM pending_users WHERE id=%s", (pending["id"],))
    conn.commit()

    cur.close()
    cur2.close()
    conn.close()

    return jsonify({"status": "ok", "message": "Registration confirmed"})

# ---------------- Login ---------------- #
@app.route("/login", methods=["POST"])
def login():
    gmail_or_phone = request.form.get("gmail_or_phone")
    password = request.form.get("password")

    conn = get_db_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users WHERE gmail=%s OR phone=%s", (gmail_or_phone, gmail_or_phone))
    user = cur.fetchone()
    cur.close()
    conn.close()

    if user and bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
        session["user_id"] = user["id"]
        return jsonify({"status": "ok", "message": "Login successful", "redirect": "/dashboard"})
    return jsonify({"status": "error", "message": "Invalid credentials"}), 401

# ---------------- Forgot Password ---------------- #
reset_codes = {}
@app.route("/forgot_password", methods=["POST"])
def forgot_password():
    gmail = request.form.get("gmail")
    if not is_valid_gmail(gmail):
        return jsonify({"status": "error", "message": "Invalid Gmail"}), 400

    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE gmail=%s", (gmail,))
    if not cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"status": "error", "message": "Gmail not registered"}), 400
    cur.close()
    conn.close()

    code = secrets.token_hex(3).upper()
    reset_codes[gmail] = code
    send_reset_email(gmail, code)
    return jsonify({"status": "ok", "message": "Reset code sent"})

@app.route("/reset_password", methods=["POST"])
def reset_password():
    gmail = request.form.get("gmail")
    code = request.form.get("code")
    new_pass = request.form.get("new_password")

    if reset_codes.get(gmail) != code:
        return jsonify({"status": "error", "message": "Invalid code"}), 400

    pw_hash = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute("UPDATE users SET password_hash=%s WHERE gmail=%s", (pw_hash, gmail))
    conn.commit()
    cur.close()
    conn.close()
    reset_codes.pop(gmail, None)
    return jsonify({"status": "ok", "message": "Password reset successful"})

# ---------------- Profile ---------------- #
@app.route("/get_profile", methods=["GET"])
def get_profile():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 403

    conn = get_db_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, first_name, last_name, gmail, phone, location, photo FROM users WHERE id=%s", (session["user_id"],))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify({"status": "ok", "user": user})

@app.route("/update_profile", methods=["POST"])
def update_profile():
    if "user_id" not in session:
        return jsonify({"status": "error", "message": "Not logged in"}), 403

    first_name = request.form.get("first_name")
    last_name = request.form.get("last_name")
    old_password = request.form.get("old_password")
    new_password = request.form.get("new_password")
    photo = request.files.get("photo")

    conn = get_db_conn()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT password_hash FROM users WHERE id=%s", (session["user_id"],))
    user = cur.fetchone()

    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    updates = []
    params = []

    if first_name:
        updates.append("first_name=%s")
        params.append(first_name)
    if last_name:
        updates.append("last_name=%s")
        params.append(last_name)

    if new_password:
        if not bcrypt.checkpw(old_password.encode(), user["password_hash"].encode()):
            return jsonify({"status": "error", "message": "Old password incorrect"}), 400
        pw_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
        updates.append("password_hash=%s")
        params.append(pw_hash)

    if photo:
        filename = f"user_{session['user_id']}.jpg"
        os.makedirs("static/uploads", exist_ok=True)
        photo.save(os.path.join("static/uploads", filename))
        photo_path = f"/static/uploads/{filename}"
        updates.append("photo=%s")
        params.append(photo_path)

    if updates:
        sql = "UPDATE users SET " + ", ".join(updates) + " WHERE id=%s"
        params.append(session["user_id"])
        cur.execute(sql, tuple(params))
        conn.commit()

    cur.close()
    conn.close()
    return jsonify({"status": "ok", "message": "Profile updated"})

# ---------------- Logout ---------------- #
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"status": "ok", "message": "Logged out"})

# ========================================================
#                SECOND FILE MERGED BELOW
# ========================================================

# ------------------ MODEL SETUP ------------------
MODEL_PATH = "fish_classifier.h5"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("fish_classifier.h5 missing!")

model = load_model(MODEL_PATH)
CLASS_NAMES = ['Catla', 'Koi', 'Pangasius', 'Shrimp', 'Tilapia']

H, W = 150, 150

def preprocess_image(path):
    img = Image.open(path).convert("RGB")
    img = img.resize((W, H))
    arr = np.array(img).astype("float32")/255.0
    arr = np.expand_dims(arr, axis=0)
    return arr

# ------------------ CHATBOT SETUP ------------------
with open("knowledge_base.json", "r", encoding="utf-8") as f:
    knowledge_base = json.load(f)

# ------------------ MYSQL SETUP (fish_info DB) ------------------
MYSQL_DB_FISH = os.getenv("MYSQL_DB", "aqua_smart")

def get_db_connection():
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB_FISH,
        charset="utf8mb4"
    )
    return conn

# ---- API: Classification ----
@app.route("/predict", methods=["POST"])
def predict():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 403

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    f = request.files["file"]
    filename = secure_filename(f.filename)
    save_dir = os.path.join("static", "uploads")
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, filename)
    f.save(save_path)

    try:
        x = preprocess_image(save_path)
        preds = model.predict(x)[0]
        idx = int(np.argmax(preds))
        predicted_name = CLASS_NAMES[idx]
        return jsonify({
            "prediction": predicted_name,
            "confidence": float(preds[idx] * 100),
            "image_url": f"/static/uploads/{filename}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- API: Fetch fish info from MySQL ----
@app.route("/fish_info", methods=["GET"])
def fish_info():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 403

    name = request.args.get("name", "").strip()
    if not name:
        return jsonify({"error": "Missing 'name' parameter"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
            SELECT summary1, summary2, fertilizer, food, water
            FROM fish_info
            WHERE name = %s
            LIMIT 1
        """
        cursor.execute(sql, (name,))
        row = cursor.fetchone()
        cursor.close()
        conn.close()

        if not row:
            return jsonify({"error": f"No info found for fish: {name}"}), 404

        return jsonify({
            "summary1": row.get("summary1") or "",
            "summary2": row.get("summary2") or "",
            "fertilizer": row.get("fertilizer") or "",
            "food": row.get("food") or "",
            "water": row.get("water") or ""
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---- API: Chatbot ----



# ---------------- DAILY GUIDE (uses fish_smart DB) ---------------- #

# ------------------ MYSQL SETUP (fish_info DB) ------------------
def get_db_conn_guide():
    return mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database="fish_smart",
        charset="utf8mb4"
    )
# ========================================================1
# ---------------- DAILY GUIDE ---------------- #
# --- helper to safely convert date objects to ISO strings ---
def to_iso_date(val):
    if val is None:
        return None
    if isinstance(val, (date, datetime)):
        return val.isoformat()
    # if already a string try to normalize (cut time part if exists)
    if isinstance(val, str):
        if "T" in val:
            return val.split("T")[0]
        if len(val) >= 10:
            return val[:10]
        return val
    return str(val)

# --- fish list used to populate select box ---
@app.route("/fish_list", methods=["GET"])
def fish_list():
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT fish_name FROM daily_fish_guide ORDER BY fish_name")
        rows = [r[0] for r in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify({"fish": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- start a new batch (stores user_id, fish, start_date) ---
@app.route("/start_batch", methods=["POST"])
def start_batch():
    # NOTE: you should have user_id in session after login.
    # For debugging/demo, fallback to user_id = 1 if not present.
    user_id = session.get("user_id", 1)
    data = request.get_json(force=True, silent=True) or {}
    fish = data.get("fish")
    if not fish:
        return jsonify({"error": "Fish required"}), 400

    today_str = date.today().isoformat()
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor()
        # single active batch per user: delete any existing
        cur.execute("DELETE FROM user_batches WHERE user_id=%s", (user_id,))
        cur.execute("INSERT INTO user_batches (user_id, fish, start_date) VALUES (%s, %s, %s)",
                    (user_id, fish, today_str))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "ok", "fish": fish, "start_date": today_str})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- clear active batch ---
@app.route("/clear_batch", methods=["POST"])
def clear_batch():
    user_id = session.get("user_id", 1)
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor()
        cur.execute("DELETE FROM user_batches WHERE user_id=%s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- get current batch for logged-in user ---
@app.route("/get_batch", methods=["GET"])
def get_batch():
    user_id = session.get("user_id", 1)
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT fish, start_date FROM user_batches WHERE user_id=%s LIMIT 1", (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"batch": None})
        # convert date object to string
        row["start_date"] = to_iso_date(row.get("start_date"))
        return jsonify({"batch": row})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- fetch guide by fish + day (1..15) ---
@app.route("/daily_guide1", methods=["GET"])
def daily_guide1():
    fish = request.args.get("fish", "").strip()
    day = request.args.get("day", type=int)
    if not fish or day is None:
        return jsonify({"error": "Missing fish or day parameter"}), 400
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT check_water, feed_name, fertilizer, care_text, youtube_link
            FROM daily_fish_guide
            WHERE fish_name=%s AND day_number=%s
            LIMIT 1
        """, (fish, day))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if not row:
            return jsonify({"guide": None})
        return jsonify({"guide": row})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- submit feedback for a batch/day ---
@app.route("/submit_feedback", methods=["POST"])
def submit_feedback():
    user_id = session.get("user_id", 1)
    data = request.get_json(force=True, silent=True) or {}
    fish = data.get("fish")
    day = data.get("day")
    feedback = data.get("feedback")
    batch_start_date = data.get("batch_start_date")
    # Accept day as string or number
    try:
        day_int = int(day)
    except Exception:
        day_int = None

    if not (fish and day_int and feedback):
        return jsonify({"error": "Missing fish/day/feedback"}), 400

    try:
        conn = get_db_conn_guide()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO daily_feedback (fish_name, day_number, batch_start_date, feedback_text)
            VALUES (%s, %s, %s, %s)
        """, (fish, day_int, batch_start_date, feedback))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- mark guide completed and move to completed table ---
@app.route("/complete_guide", methods=["POST"])
def complete_guide():
    user_id = session.get("user_id", 1)
    data = request.get_json(force=True, silent=True) or {}
    fish = data.get("fish")
    if not fish:
        return jsonify({"error": "Missing fish"}), 400
    complete_date = date.today().isoformat()
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor()
        cur.execute("INSERT INTO user_completed_guides (user_id, fish, complete_date) VALUES (%s, %s, %s)",
                    (user_id, fish, complete_date))
        cur.execute("DELETE FROM user_batches WHERE user_id=%s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"status": "ok", "complete_date": complete_date})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- return completed guides for the user ---
@app.route("/get_completed_guides", methods=["GET"])
def get_completed_guides():
    user_id = session.get("user_id", 1)
    try:
        conn = get_db_conn_guide()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT fish, complete_date FROM user_completed_guides WHERE user_id=%s ORDER BY complete_date DESC",
                    (user_id,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        # convert date objects
        for r in rows:
            r["complete_date"] = to_iso_date(r.get("complete_date"))
        return jsonify({"completed": rows})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
#-------------------------------chatbot
# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


@app.route("/chatbot", methods=["POST"])
def chatbot_response():
    try:
        user_msg = request.json.get("message", "").strip()

        # Detect if user message is Bangla or English
        is_bangla = bool(re.search(r'[\u0980-\u09FF]', user_msg))

        if is_bangla:
            lang_instruction = (
                "Answer in Bangla only. Be short and clear like a fish expert. "
                "Give 1-2 sentences only. Use natural Bangla language."
            )
        else:
            lang_instruction = (
                "Answer in English only. Be short, precise, and professional like a fish expert. "
                "Keep the reply within 1-2 sentences."
            )

        # Create the full prompt
        prompt = (
            "You are AquaSmart — a professional fish farming expert chatbot from Bangladesh. "
            "You provide short, practical farming advice.\n"
            f"{lang_instruction}\n\n"
            f"User: {user_msg}\n"
            "Bot:"
        )

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        bot_reply = response.text.strip()

        return jsonify({"response": bot_reply})

    except Exception as e:
        return jsonify({"response": f"⚠️ Error: {str(e)}"})

# ========================================================MarketPlace
UPLOAD_FOLDER = "static/uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
# Profile DB (login & users)
def get_profile_conn():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="profile_smart"
    )

# Marketplace DB (listings, cart, orders)
def get_market_conn():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="marketplace"
    )

@app.route("/marketplace")
def marketplace():
    if "user_id" not in session:
        return redirect(url_for("index"))
    
    conn = get_market_conn()
    cur = conn.cursor(dictionary=True)
    # All listings with seller info
    cur.execute("""
        SELECT l.*, u.first_name, u.last_name, u.gmail, u.phone, u.location, u.photo as user_photo
        FROM listings l
        JOIN profile_smart.users u ON l.user_id = u.id
        ORDER BY l.created_at DESC
    """)
    listings = cur.fetchall()

    # Orders for my listings (Pending + Confirmed)
    cur.execute("""
        SELECT c.*, l.fish_type, l.price, l.image,
               u.first_name, u.last_name, u.gmail, u.phone
        FROM cart c
        JOIN listings l ON c.listing_id = l.id
        JOIN profile_smart.users u ON c.buyer_id = u.id
        WHERE l.user_id = %s
        ORDER BY c.created_at DESC
    """, (session["user_id"],))
    seller_orders = cur.fetchall()

    # My Cart
    cur.execute("""
        SELECT c.*, l.fish_type, l.price, l.image,
               s.first_name, s.last_name
        FROM cart c
        JOIN listings l ON c.listing_id = l.id
        JOIN profile_smart.users s ON l.user_id = s.id
        WHERE c.buyer_id = %s
        ORDER BY c.created_at DESC
    """, (session["user_id"],))
    cart = cur.fetchall()

    cur.close()
    conn.close()

    return render_template("marketplace.html",
                           listings=listings,
                           seller_orders=seller_orders,
                           cart=cart,user=fetch_user())

# Create a new fish listing
@app.route("/create_listing", methods=["POST"])
def create_listing():
    if "user_id" not in session:
        return redirect(url_for("index"))

    fish_type = request.form["fish_type"]
    price = request.form["price"]
    quantity = request.form["quantity"]
    description = request.form["description"]

    image = None
    if "image" in request.files:
        file = request.files["image"]
        if file and file.filename != "":
            filename = secure_filename(file.filename)
            image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(image_path)
            # save only the relative path for browser
            image = f"/static/uploads/{filename}"


    conn = get_market_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO listings (user_id, fish_type, price, quantity, description, image, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (session["user_id"], fish_type, price, quantity, description, image, datetime.now()))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("marketplace"))

# Place an order (goes to cart, pending)
@app.route("/order/<int:listing_id>", methods=["POST"])
def place_order(listing_id):
    if "user_id" not in session:
        return redirect(url_for("index"))

    buyer_name = request.form["buyer_name"]
    buyer_phone = request.form["buyer_phone"]
    buyer_address = request.form["buyer_address"]

    conn = get_market_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO cart (listing_id, buyer_id, buyer_name, buyer_phone, buyer_address, status, created_at)
        VALUES (%s, %s, %s, %s, %s, 'Pending', %s)
    """, (listing_id, session["user_id"], buyer_name, buyer_phone, buyer_address, datetime.now()))
    cart_id = cur.lastrowid

    # Insert into orders for permanent history
    cur.execute("INSERT INTO orders (cart_id) VALUES (%s)", (cart_id,))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("marketplace"))

# Confirm order (seller side)
@app.route("/confirm_order/<int:order_id>", methods=["POST"])
def confirm_order(order_id):
    conn = get_market_conn()
    cur = conn.cursor()
    cur.execute("UPDATE cart SET status='Confirmed' WHERE id=%s", (order_id,))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("marketplace"))
# Delete a listing (only owner can delete)
@app.route("/delete_listing/<int:listing_id>", methods=["POST"])
def delete_listing(listing_id):
    if "user_id" not in session:
        return redirect(url_for("index"))

    conn = get_market_conn()
    cur = conn.cursor()
    # only allow delete if the listing belongs to the current session user
    cur.execute("DELETE FROM listings WHERE id=%s AND user_id=%s", (listing_id, session["user_id"]))
    conn.commit()
    cur.close()
    conn.close()
    return redirect(url_for("marketplace"))

#-----------------water quality advice----------------------------------------

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY2"))

@app.route("/get_advice", methods=["POST"])
def get_advice():
    try:
        ph_value = request.json.get("ph")
        temp_value = request.json.get("temperature")

        # Create prompt for Gemini
        prompt = f"""
You are AquaSmart, a Bangladesh fish farming expert.
Sensor Data:
- pH: {ph_value}
- Temperature: {temp_value}°C

Give a short paragraph of practical farming advice:
1. Is the pH good or bad?
2. What fertilizer or medicine should be applied?
3. What water treatment is needed?
4. Give care instructions for healthy fish fry growth.
Use clear and professional language.
"""

        # Call Gemini model (same as chatbot)
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        ai_reply = response.text.strip()

        return jsonify({"advice": ai_reply})

    except Exception as e:
        return jsonify({"advice": f"⚠️ Error: {str(e)}"})
#-----------------------------------
if __name__ == "__main__":
    app.run(debug=True)
