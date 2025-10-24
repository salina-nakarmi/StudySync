import os
from dotenv import load_dotenv


load_dotenv()

def main():
    print("Hello from backend")
    database_url = os.getenv("DATABASE_URL")

    if database_url:
        print(" DATABASE_URL Loaded successfully.")
        print(f" Using database:{database_url.split('@'[-1])}")


    else:
        print("CRITICAL ERROR : DATABASE_URL not found!")
        print(" Please check your .env file and ensure 'DATABASE_URL' is set") 


if __name__=="__main__":
    main()
