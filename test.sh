#!/usr/bin/env bash

url="https://www.birdeye.so/tv-widget/2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv?chain=solana&viewMode=pair&chartInterval=60&chartType=Candle&chartTimezone=Europe%2FBelgrade&chartLeftToolbar=hide&theme=dark"
url="https://dexscreener.com/solana/2Li2Rq9tZXT2X737okmkPg2TTYpzbRQnmDMuJ2n4aSXT?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0&loadChartSettings=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=60"
url="https://www.birdeye.so/tv-widget/2z1p8xCEjRzpBHjXWrx4tJnz7BFL6z7NnvbCxH7bpump?chain=solana&viewMode=pair&chartInterval=60&chartType=Candle&chartTimezone=Europe%2FBelgrade&chartLeftToolbar=hide&theme=dark"

test_mode=${1:-"normal"} # Default to normal mode if no argument provided

echo "Taking screenshot of $url"

case $test_mode in
  "cache")
    echo "Testing cache functionality with short TTL (5 seconds)"
    
    # First request - store in cache
    echo "1. Making initial request with returnUrl=true and TTL=5..."
    response=$(curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'","ttl":5,"returnUrl":true}')
    
    cached_url=$(echo $response | grep -o '/cache/[^"]*')
    echo "✓ Image cached at: http://localhost:3000$cached_url"
    
    # Download and check the image from cache using screenshot endpoint
    echo -e "\n2. Verifying cache hit..."
    response=$(curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'","returnUrl":true}')
    
    if [[ $response == *"$cached_url"* ]]; then
        echo "✓ Cache hit confirmed (same URL returned)"
    else
        echo "✗ Cache miss (unexpected)"
        exit 1
    fi
    
    echo -e "\n3. Waiting 6 seconds for cache to expire..."
    sleep 6
    
    # Check cache status after expiry using screenshot endpoint
    echo -e "\n4. Verifying cache expiration..."
    response=$(curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'","returnUrl":true}')
    
    new_url=$(echo $response | grep -o '/cache/[^"]*')
    if [[ $new_url != $cached_url ]]; then
        echo "✓ Cache expired as expected (new URL generated)"
        echo "New cache URL: http://localhost:3000$new_url"
    else
        echo "✗ Cache not expired (unexpected)"
        exit 1
    fi
    ;;
    
  *)
    # Default behavior - direct binary response
    curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'"}' \
      --output screenshot.png
    echo "✓ Screenshot saved as screenshot.png"
    xdg-open screenshot.png
    ;;
esac



https://screenshot.app.vlazic.com


 curl -s -X POST https://screenshot.app.vlazic.com/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"https://www.birdeye.so/tv-widget/2z1p8xCEjRzpBHjXWrx4tJnz7BFL6z7NnvbCxH7bpump?chain=solana&viewMode=pair&chartInterval=60&chartType=Candle&chartTimezone=Europe%2FBelgrade&chartLeftToolbar=hide&theme=dark"}'