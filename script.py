import requests
import pandas as pd
from collections import OrderedDict
import sys
import json
from bs4 import BeautifulSoup
import multiprocessing  
from multiprocessing import Pool

def read_in():
    lines = sys.stdin.readlines()
    # Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def parse_and_get_df(idn):
    page = requests.get("http://www.imdb.com/title/{}/episodes?season=1".format(idn))
    soup = BeautifulSoup(page.content, 'html.parser')
    #get how many seasons are there
    table=soup.find(id="bySeason")
    numofseas=[]
    seasnr=table.findAll('option')
    x=1
    for i in seasnr:
        numofseas.append(x)
        x+=1
    numofseas
    #now i have list of that many seasons i will loop for every of them and create dataframe and then merge it
    name=[]
    ratings=[]
    seasonlist=[]
    epnumbers=[]
    for k in numofseas:
        page = requests.get("http://www.imdb.com/title/{}/episodes?season={}".format(idn,k))
        soup = BeautifulSoup(page.content, 'html.parser')
        
        #check if season is not released yet
        table=soup.findAll('div', {"class":"ipl-rating-star--placeholder"})
        if not table:
            
            #Below give names of episodes
            table=soup.findAll('a', {"itemprop": "name" })
            for i in table:
                #print(i.get_text())
                name.append(i.get_text())
            #Below give ratings numbers
            table=soup.findAll('span', {"class": "ipl-rating-star__rating" })
            ratinglist=table[0::23]
            for i in ratinglist:
                #print(i.get_text())
                ratings.append(i.get_text())
            #Below give season number
            table=soup.findAll('h3', {"itemprop":"name"})
            season=table[1].get_text()[-1]
            for i in range(len(ratinglist)):
                seasonlist.append(season)
            #Below give episode number
            for i in range(len(ratinglist)):
                epnumbers.append(i+1)

    #Below give name of the show
    table=soup.find('a', {"class":"subnav_heading"})
    show=table.get_text()  
    showmulti=[show for i in range(len(name))]

    #create dataframe for the series
    return pd.DataFrame( OrderedDict( (('series', pd.Series(showmulti)), 
                                   ('name', pd.Series(name)), 
                                   ('season', pd.Series(seasonlist)), 
                                   ('number', pd.Series(epnumbers)), 
                                   ('rating', pd.Series(ratings))) ) )
    
def main():
    lines = read_in()
    arr=[]
    for i in lines:
        arr.append(i)
        
    
    with Pool(4) as p:
        dfs = p.map(parse_and_get_df, arr)
        
    #dfs = list(parse_and_get_df(idn) for idn in arr)
    df=pd.concat(dfs)
    df=df.reset_index()
    
    print(df.to_json(orient='index'))


if __name__ == '__main__':
    main()