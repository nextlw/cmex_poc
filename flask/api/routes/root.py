# Bibliotecas
from flask import Blueprint, jsonify

# Cria a blueprint
root = Blueprint("root", __name__)

# /api
@root.route("/", methods=["GET"])
def index():
    return jsonify({"message": "API no ar :)"}), 200