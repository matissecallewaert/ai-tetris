import pandas as pd
from urllib import request
import ssl
import json


url = "https://listfist.com/list-of-tetris-high-scores-nes-pal"
context = ssl._create_unverified_context()
response = request.urlopen(url, context=context)
html = response.read()

list = pd.read_html(html)
player_count = 10
data = list[0]

with open("data.json", "w") as outputfile:
    outputfile.write('{\n\t"Players": [\n')
    for i in range(player_count - 1):
        outputfile.write(
            '\t\t{\n\t\t\t"Rank": "'
            + str(data.at[i, "Rank"])
            + '",\n\t\t\t"Player name": "'
            + str(data.at[i, "Player Name"])
            + '",\n\t\t\t"Score": "'
            + str(data.at[i, "Score(2 April, 2022)[source]"])
            + '"\n\t\t},\n'
        )

    outputfile.write(
        '\t\t{\n\t\t\t"Rank": "'
        + str(data.at[player_count - 1, "Rank"])
        + '",\n\t\t\t"Player name": "'
        + str(data.at[player_count - 1, "Player Name"])
        + '",\n\t\t\t"Score": "'
        + str(data.at[player_count - 1, "Score(2 April, 2022)[source]"])
        + '"\n\t\t}\n\t]\n}'
    )
