from database import engine, Base
import models
import main

print("Creating tables if they don't exist...")
Base.metadata.create_all(bind=engine)
print("Done!")
