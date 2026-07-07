from fastapi import FastAPI
from services.yfinance.main import get_multiple_stock_histories

app = FastAPI()

MAG7_TICKERS = ["AAPL", "MSFT", "GOOG", "AMZN", "META", "TSLA", "NVDA"]

# TODO: Add start and end dates as query parameters to the route.
@app.get("/returns")
async def get_daily_returns():
    stock_histories = get_multiple_stock_histories(MAG7_TICKERS, start_date="2026-01-01", end_date="2026-01-31")

    print("Stock Histories:")
    for ticker, data in stock_histories.items():
        print(f"{ticker}:")
        print(data)
        print("\n")

    return {"message": "Hello World", "stock_data": {ticker: data.to_dict(orient="records") for ticker, data in stock_histories.items()}}