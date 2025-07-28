#!/usr/bin/env python3

import time
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

def geocode_address(geolocator, address, retries=3, pause=1.0):
    for i in range(retries):
        try:
            return geolocator.geocode(address)
        except GeocoderTimedOut:
            time.sleep(pause)
    return None

def main():
    # 1) Load your CSV
    df = pd.read_csv("oregonMachines.csv")

    # 2) Build a full address string
    df["full_address"] = (
        df["address"].astype(str) + ", "
      + df["city"].astype(str)    + ", "
      + df["state"].astype(str)   + ", USA"
    )

    # 3) Set up Nominatim
    geolocator = Nominatim(user_agent="oregon-geocoder", timeout=10)

    # 4) Geocode each row
    lats, lons = [], []
    for addr in df["full_address"]:
        loc = geocode_address(geolocator, addr)
        if loc:
            lats.append(loc.latitude)
            lons.append(loc.longitude)
        else:
            lats.append(None)
            lons.append(None)
        # respect rate‐limit
        time.sleep(1.0)

    # 5) Save results
    df["latitude"]  = lats
    df["longitude"] = lons
    df.drop(columns=["full_address"], inplace=True)  # optional
    df.to_csv("oregonMachines_geocoded.csv", index=False)
    print("Wrote geocoded CSV with latitude/longitude.")

if __name__ == "__main__":
    main()
