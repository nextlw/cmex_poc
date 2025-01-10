# BIBLIOTECAS
from flask import Flask, redirect, jsonify, request, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from supabase import create_client, Client
from dotenv import load_dotenv
import os
import importlib.util

# Variável global do rate limiter
global LIMITER

# Carrega as variáveis de ambiente
load_dotenv()

# Atribui as variáveis de ambiente
ENV = os.getenv("ENV")
FLASK_CONFIG_SECRET_KEY = os.getenv("FLASK_CONFIG_SECRET_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPEN_AI_KEY = os.getenv("OPEN_AI_KEY")

# Cria o cliente do Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def create_flask_app():

    # Cria e configura um aplicativo do Flask
    app = Flask(__name__)
    app.config["SECRET_KEY"] = FLASK_CONFIG_SECRET_KEY

    # Configuração do Flask-Limiter
    global LIMITER
    LIMITER = Limiter(app=app, key_func=get_remote_address)

    # Configura as políticas de CORS
    CORS(app, origins=["http://localhost:5173" if ENV == "dev" else ""])

    # Handler global para 404 (Not Found)
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Página não encontrada"}, 404

    # Handler global para 405 (Method Not Allowed)
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Método não permitido"}), 405

    # Validação antes de cada requisição
    @app.before_request
    def before_request():

        # Pega o header de autorização
        auth_header = request.headers.get("Authorization")

        # Verifica se o header está presente
        if auth_header:
            try:

                # Assumindo formato "Bearer <token>"
                token = auth_header.split(" ")[1]

                # Verifica a validade do token usando Supabase
                user = supabase.auth.get_user(token)

                # Armazena o usuário no g para uso posterior
                g.user = user.user

            except Exception:
                return jsonify({"error": "Token inválido ou expirado"}), 401
        else:
            return jsonify({"error": "Token de autenticação não fornecido"}), 401

    # Define a rota raiz
    @app.route("/")
    def root():
        return redirect("/api")

    # Caminho para a pasta de rotas
    routes = os.path.join(app.root_path, "routes")

    # Registro dinâmico das blueprints
    for route in os.listdir(routes):

        # Verifica se é um arquivo de rota (.py)
        if route.endswith(".py"):

            # Caminho do arquivo da rota
            route_path = os.path.join(routes, route)

            # Nome da rota e da blueprint
            route_name = route.split(".")[0]

            # Cria um nome de módulo com base no caminho do arquivo
            module_name = f"api.routes.{route_name}"

            # Importa o módulo
            spec = importlib.util.spec_from_file_location(module_name, route_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Pega a blueprint do módulo
            blueprint = getattr(module, route_name, None)

            # Registra a blueprint
            app.register_blueprint(
                blueprint,
                url_prefix=f"/api/{route_name if route_name != 'root' else ''}",
            )

    return app
