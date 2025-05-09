import mysql.connector
import json

mydb = mysql.connector.connect(
    host = "localhost", 
    user = "root", 
    password = "root", 
    database = "hashim" 
)

sku = input("Enter a barcode to get a food: ") 
allergen = "wheat"
lower_allergen = allergen.lower()
upper_allergen = allergen.upper()
title_allergen = allergen.title()

#input("Enter an allergen: ")

search_string = f"SELECT food.fdc_id AS SKU, branded_food.ingredients AS Ingredients, food.description AS Description FROM hashim.food INNER JOIN hashim.branded_food ON hashim.food.fdc_id=hashim.branded_food.fdc_id WHERE food.fdc_id = '{sku}';"

cursor = mydb.cursor()

cursor.execute(search_string)
#columns = cursor.description
#result = cursor.fetchall()

#for thing in result: 
#    print(thing)

result = [dict((cursor.description[i][0], value) for i, value in enumerate(row)) for row in cursor.fetchall()][0]

ingredients = result.get("Ingredients")
print(ingredients)

print(f"--- Using {allergen} as an example allergen ---")
if lower_allergen in ingredients or upper_allergen in ingredients: 
    print(">>> unsafe <<<")
else: 
    print(">>> safe <<<")
#column_names = []
#for column in columns: 
#    column_names.append(column[0])
#
#
#for i in range(len(column_names)): 
#    print(column_names[i] + ":   " + result[0][i])