import redis
import time

# Configuração do Redis
REDIS_HOST = "localhost"
REDIS_PORT = 6378
REDIS_PASSWORD = None
REDIS_TLS = False

# Criar cliente Redis
try:
    print("Conectando ao Redis...")
    redis_client = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        ssl=REDIS_TLS,
        decode_responses=True
    )
    
    # Testar com ping
    result = redis_client.ping()
    print(f"Ping do Redis: {result}")
    
    # Testar pub/sub
    print("\nTestando pub/sub...")
    pubsub = redis_client.pubsub()
    pubsub.subscribe("canal_teste")
    
    # Publicar mensagem
    redis_client.publish("canal_teste", "Olá do Python!")
    
    # Receber mensagem
    print("Aguardando mensagem (max 3 segundos)...")
    for i in range(3):
        message = pubsub.get_message(timeout=1)
        if message and message["type"] == "message":
            print(f"Mensagem recebida: {message['data']}")
            break
        else:
            print(f"Tentativa {i+1}: {message}")
            time.sleep(1)
    
    # Testar set/get
    print("\nTestando set/get...")
    redis_client.set("python_test_key", "valor_teste")
    value = redis_client.get("python_test_key")
    print(f"Valor recuperado: {value}")
    
    print("\nTeste Redis concluído com sucesso!")
    
except Exception as e:
    print(f"Erro ao conectar com Redis: {e}") 