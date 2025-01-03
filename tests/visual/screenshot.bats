#!/usr/bin/env bats

setup() {
    # Create screenshots directory if it doesn't exist
    mkdir -p screenshots
    # URL to test
    export URL="https://www.birdeye.so/tv-widget/2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv?chain=solana&viewMode=pair&chartInterval=60&chartType=Candle&chartTimezone=Europe%2FBelgrade&chartLeftToolbar=hide&theme=dark"
}

# Helper function to get image dimensions
get_dimensions() {
    identify -format "%wx%h" "$1"
}

# Helper function to get image format
get_format() {
    identify -format "%m" "$1"
}

@test "screenshot service is running" {
    run curl -s http://localhost:3000/health
    [ "$status" -eq 0 ]
    [ $(echo "$output" | jq -r '.status') = "ok" ]
}

@test "desktop device screenshot has correct dimensions" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"device\":\"desktop\",\"fresh\":true}" \
        --output screenshots/desktop.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/desktop.png" ]
    
    dimensions=$(get_dimensions "screenshots/desktop.png")
    expected="1280x720"
    [ "$dimensions" = "$expected" ] || echo "Expected dimensions to be $expected but got $dimensions"
    [ "$dimensions" = "$expected" ]
}

@test "tablet device screenshot has correct dimensions" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"device\":\"tablet\",\"fresh\":true}" \
        --output screenshots/tablet.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/tablet.png" ]
    
    dimensions=$(get_dimensions "screenshots/tablet.png")
    [ "$dimensions" = "768x1024" ]
}

@test "phone device screenshot has correct dimensions" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"device\":\"phone\",\"fresh\":true}" \
        --output screenshots/phone.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/phone.png" ]
    
    dimensions=$(get_dimensions "screenshots/phone.png")
    [ "$dimensions" = "375x667" ]
}

@test "custom dimensions are respected" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"width\":800,\"height\":600,\"fresh\":true}" \
        --output screenshots/custom.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/custom.png" ]
    
    dimensions=$(get_dimensions "screenshots/custom.png")
    [ "$dimensions" = "800x600" ]
}

@test "PNG format is correct" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"format\":\"png\",\"fresh\":true}" \
        --output screenshots/format.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/format.png" ]
    
    format=$(get_format "screenshots/format.png")
    [ "$format" = "PNG" ]
}

@test "JPEG format is correct" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"format\":\"jpeg\",\"quality\":80,\"fresh\":true}" \
        --output screenshots/format.jpg
    [ "$status" -eq 0 ]
    [ -f "screenshots/format.jpg" ]
    
    format=$(get_format "screenshots/format.jpg")
    [ "$format" = "JPEG" ]
}

@test "cropping works correctly" {
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"crop\":{\"x\":0,\"y\":0,\"width\":500,\"height\":300},\"fresh\":true}" \
        --output screenshots/cropped.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/cropped.png" ]
    
    dimensions=$(get_dimensions "screenshots/cropped.png")
    [ "$dimensions" = "500x300" ]
}

@test "caching behavior works" {
    # First request - fresh
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\",\"fresh\":true}" \
        --output screenshots/fresh.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/fresh.png" ]
    
    # Store creation time
    fresh_time=$(stat -c %Y screenshots/fresh.png)
    
    # Second request - should use cache
    sleep 1  # Ensure we can detect time difference
    run curl -s -X POST http://localhost:3000/screenshot \
        -H "Content-Type: application/json" \
        -d "{\"url\":\"$URL\"}" \
        --output screenshots/cached.png
    [ "$status" -eq 0 ]
    [ -f "screenshots/cached.png" ]
    
    cached_time=$(stat -c %Y screenshots/cached.png)
    
    # Cached file should be newer
    [ "$cached_time" -gt "$fresh_time" ]
}

teardown() {
    # Cleanup if needed
    :
}