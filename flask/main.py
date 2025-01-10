# Importa o criador de apps
from api import create_flask_app, ENV

# Cria o app em Flask
app = create_flask_app()

# Inicializa o webserver
if __name__ == "__main__":

    app.run(debug=ENV=="dev", host="127.0.0.1", port="5000")
