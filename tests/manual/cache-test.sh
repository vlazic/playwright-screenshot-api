#!/usr/bin/env bash

url="https://www.birdeye.so/tv-widget/2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv?chain=solana&viewMode=pair&chartInterval=60&chartType=Candle&chartTimezone=Europe%2FBelgrade&chartLeftToolbar=hide&theme=dark"
url="https://dexscreener.com/solana/2Li2Rq9tZXT2X737okmkPg2TTYpzbRQnmDMuJ2n4aSXT?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0&loadChartSettings=0&chartTheme=dark&theme=dark&chartStyle=0&chartType=usd&interval=60"
url="https://www.birdeye.so/tv-widget/2z1p8xCEjRzpBHjXWrx4tJnz7BFL6z7NnvbCxH7bpump?chain=solana&viewMode=pair&chartInterval=60&chartType=Candle&chartTimezone=Europe%2FBelgrade&chartLeftToolbar=hide&theme=dark"

test_mode=${1:-"normal"} # Default to normal mode if no argument provided

echo "Taking screenshot of $url"

case $test_mode in
  "cache")
    echo "Testing cache functionality"
    
    # First request - store in cache (without fresh flag)
    echo "1. Making initial request with returnUrl=true..."
    response=$(curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'","returnUrl":true}')
    
    cached_url=$(echo $response | grep -o '/cache/[^"]*')
    echo "✓ Image cached at: http://localhost:3000$cached_url"
    
    # Download cached image
    curl -s "http://localhost:3000$cached_url" --output "$(dirname "$0")/cached.png"
    echo "✓ Cached image downloaded to $(dirname "$0")/cached.png"
    
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
    
    echo -e "\n3. Forcing fresh screenshot..."
    
    # Request fresh screenshot using fresh flag (will be returned directly)
    echo -e "\n4. Verifying fresh screenshot generation..."
    curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'","fresh":true}' \
      --output "$(dirname "$0")/new.png"
    
    echo "✓ Fresh screenshot saved to $(dirname "$0")/new.png"
    ;;
    
  *)
    # Default behavior - direct binary response
    curl -s -X POST http://localhost:3000/screenshot \
      -H "Content-Type: application/json" \
      -d '{"url":"'$url'"}' \
      --output "$(dirname "$0")/screenshot.png"
    echo "✓ Screenshot saved as $(dirname "$0")/screenshot.png"
    xdg-open "$(dirname "$0")/screenshot.png"
    ;;
esac
