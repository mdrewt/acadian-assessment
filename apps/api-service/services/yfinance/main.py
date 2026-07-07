# This module is a wrapper around the yfinance library to fetch historical stock data for a given ticker or multiple tickers. It provides functions to format the data and calculate daily returns.
# This module needs to be refactored to use asyncio and aiohttp for concurrent requests to yfinance. The current implementation is synchronous and may be slow for multiple tickers.

# import asyncio
import pandas as pd
import yfinance as yf
from typing import Dict, List

def _format_stock(stock_df: pd.DataFrame) -> pd.DataFrame:
    history_columns = ["Open", "Close"] # Ommitted columns: ["High", "Low", "Volume", "Dividends", "Stock Splits"]
    stock_df = stock_df[history_columns].sort_index(ascending=True)
    stock_df["Previous"] = stock_df["Close"].shift(1).fillna(stock_df["Open"])
    stock_df["Intraday Return"] = (stock_df["Close"] - stock_df["Open"]) / stock_df["Open"]
    stock_df["Daily Return"] = (stock_df["Close"] - stock_df["Previous"]) / stock_df["Previous"]

    return stock_df.reset_index()

def get_stock_history(ticker: str, start_date: str = "2026-01-01", end_date: str = "2026-01-31") -> Dict[str, pd.DataFrame]:
    # Step 1: Fetch historical data for a single ticker using yfinance
    stock = yf.Ticker(ticker)

    # Step 2: Extract the historical data for the specified date range
    history =  pd.DataFrame(stock.history(start=start_date, end=end_date))

    # Step 3: Format the historical data for the ticker  
    history_dict = {ticker: _format_stock(history)}

    return history_dict

def get_multiple_stock_histories(tickers: List[str], start_date: str = "2026-01-01", end_date: str = "2026-01-31") -> Dict[str, pd.DataFrame]:
    # Step 1: Fetch historical data for multiple tickers using yfinance
    stocks = yf.Tickers(' '.join(tickers))
    
    # Step 2: Extract the historical data for the specified date range
    history =  pd.DataFrame(stocks.history(start=start_date, end=end_date))

    # Step 3: Format the historical data for each ticker   
    history_dict = {ticker: _format_stock(history.xs(ticker, level=1, axis=1)) for ticker in tickers}
    
    return history_dict
