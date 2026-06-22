import csv
import sys
import random

def generate_towns(n=100):
    center_lat = 37.7749
    center_lon = -122.4194
    towns = []
    
    prefixes = ["North", "South", "East", "West", "New", "Old", "Lake", "River", "Mount", "Valley"]
    suffixes = ["ville", "town", "burg", "field", "wood", "ford", "port", "view", "side", "hill"]
    
    for i in range(n):
        # Random offset within ~0.5 degrees (approx 50km)
        lat_offset = random.uniform(-0.5, 0.5)
        lon_offset = random.uniform(-0.5, 0.5)
        
        lat = center_lat + lat_offset
        lon = center_lon + lon_offset
        
        name = f"{random.choice(prefixes)} {random.choice(suffixes)}"
        name = f"{random.choice(prefixes)}{random.choice(suffixes)} {i+1}"
        
        population = random.randint(1000, 100000)
        
        towns.append({
            "name": name,
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "population": population
        })
        
    return towns

data = generate_towns()

writer = csv.DictWriter(sys.stdout, fieldnames=["name", "lat", "lon", "population"])
writer.writeheader()
writer.writerows(data)
