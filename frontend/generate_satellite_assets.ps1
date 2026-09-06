# generate_satellite_assets.ps1
# Creates authentic, valid, standalone JPEG assets for all SatQuery AI reports.
Add-Type -AssemblyName System.Drawing

$satDir = "c:\Users\disha\Desktop\SatQuery-AI\frontend\public\satellite"

function Copy-ImageFile ($sourceName, $targetName) {
    $src = Join-Path $satDir $sourceName
    $dst = Join-Path $satDir $targetName
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Force
        Write-Host "Copied $sourceName -> $targetName"
    }
}

# 1. Base Copies for exact names
Copy-ImageFile "godavari_optical.jpg" "water-optical.jpg"
Copy-ImageFile "brahmaputra_flood.jpg" "flood.jpg"
Copy-ImageFile "punjab_agriculture.jpg" "vegetation-optical.jpg"
Copy-ImageFile "kerala_wetlands.jpg" "landcover-before.jpg"
Copy-ImageFile "odisha_coast.jpg" "cyclone.jpg"
Copy-ImageFile "gujarat_port.jpg" "infrastructure.jpg"
Copy-ImageFile "bengaluru_urban.jpg" "urban-before.jpg"
Copy-ImageFile "bengaluru_urban.jpg" "urban-after.jpg"
Copy-ImageFile "tamilnadu_coast.jpg" "coastal-before.jpg"
Copy-ImageFile "tamilnadu_coast.jpg" "coastal-after.jpg"
Copy-ImageFile "delhi_airport.jpg" "airport.jpg"
Copy-ImageFile "sundarbans_delta.jpg" "sundarbans.jpg"
Copy-ImageFile "jamnagar_refinery.jpg" "grounding.jpg"
Copy-ImageFile "marathwada_reservoir.jpg" "drought-before.jpg"

# 2. Generate SAR Grayscale Image for Water (SAR backscatter simulation)
function Create-SarImage ($sourceName, $targetName) {
    $src = Join-Path $satDir $sourceName
    $dst = Join-Path $satDir $targetName
    $bmp = [System.Drawing.Bitmap]::FromFile($src)
    $w = $bmp.Width
    $h = $bmp.Height
    $outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    # Use color matrix for high-contrast radar backscatter
    $cm = New-Object System.Drawing.Imaging.ColorMatrix
    $cm.Matrix00 = 0.33; $cm.Matrix01 = 0.33; $cm.Matrix02 = 0.33
    $cm.Matrix10 = 0.33; $cm.Matrix11 = 0.33; $cm.Matrix12 = 0.33
    $cm.Matrix20 = 0.33; $cm.Matrix21 = 0.33; $cm.Matrix22 = 0.33
    $cm.Matrix33 = 1.0; $cm.Matrix44 = 1.0
    
    $ia = New-Object System.Drawing.Imaging.ImageAttributes
    $ia.SetColorMatrix($cm)
    $g.DrawImage($bmp, [System.Drawing.Rectangle]::new(0, 0, $w, $h), 0, 0, $w, $h, [System.Drawing.GraphicsUnit]::Pixel, $ia)
    
    # Add subtle SAR radar telemetry stamp
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 10, 15, 25))
    $g.FillRectangle($brush, 14, 14, 250, 36)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 240, 250))
    $font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
    $g.DrawString("SENTINEL-1 C-SAR • VV/VH RADAR", $font, $textBrush, 20.0, 22.0)
    
    $g.Dispose()
    $bmp.Dispose()
    $outBmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $outBmp.Dispose()
    Write-Host "Created $targetName"
}
Create-SarImage "water-optical.jpg" "water-sar.jpg"

# 3. Generate Result Images with realistic AI overlays
function Create-OverlayImage ($sourceName, $targetName, $overlayType) {
    $src = Join-Path $satDir $sourceName
    $dst = Join-Path $satDir $targetName
    $bmp = [System.Drawing.Bitmap]::FromFile($src)
    $w = $bmp.Width
    $h = $bmp.Height
    $outBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($outBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.DrawImage($bmp, 0, 0, $w, $h)

    $font = New-Object System.Drawing.Font("Arial", 9, [System.Drawing.FontStyle]::Bold)
    $hudFont = New-Object System.Drawing.Font("Arial", 8, [System.Drawing.FontStyle]::Regular)

    switch ($overlayType) {
        "water" {
            # Cyan water segmentation mask
            $maskBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 6, 182, 212))
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 34, 211, 238), 2.5)
            $pts = @(
                [System.Drawing.Point]::new([int]($w*0.3), [int]($h*0.2)),
                [System.Drawing.Point]::new([int]($w*0.55), [int]($h*0.3)),
                [System.Drawing.Point]::new([int]($w*0.8), [int]($h*0.55)),
                [System.Drawing.Point]::new([int]($w*0.95), [int]($h*0.75)),
                [System.Drawing.Point]::new([int]($w*0.95), $h),
                [System.Drawing.Point]::new([int]($w*0.4), $h),
                [System.Drawing.Point]::new([int]($w*0.25), [int]($h*0.7)),
                [System.Drawing.Point]::new([int]($w*0.2), [int]($h*0.4))
            )
            $g.FillPolygon($maskBrush, $pts)
            $g.DrawPolygon($pen, $pts)
            
            # Badge
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 8, 47, 73))
            $g.FillRectangle($bg, [int]($w*0.5), [int]($h*0.45), 210, 42)
            $g.DrawRectangle($pen, [int]($w*0.5), [int]($h*0.45), 210, 42)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(103, 232, 249))
            $g.DrawString("WATER MASK (54.8 km²)", $font, $tBrush, [float]($w*0.5 + 10), [float]($h*0.45 + 6))
            $wBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.DrawString("Joint Optical + SAR Fusion • 88% Conf", $hudFont, $wBrush, [float]($w*0.5 + 10), [float]($h*0.45 + 24))
        }
        "flood" {
            # Crimson flood inundation mask
            $maskBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(115, 225, 29, 72))
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 244, 63, 94), 2.5)
            $pts = @(
                [System.Drawing.Point]::new(0, [int]($h*0.35)),
                [System.Drawing.Point]::new([int]($w*0.35), [int]($h*0.25)),
                [System.Drawing.Point]::new([int]($w*0.7), [int]($h*0.4)),
                [System.Drawing.Point]::new($w, [int]($h*0.42)),
                [System.Drawing.Point]::new($w, [int]($h*0.85)),
                [System.Drawing.Point]::new([int]($w*0.55), [int]($h*0.9)),
                [System.Drawing.Point]::new(0, [int]($h*0.75))
            )
            $g.FillPolygon($maskBrush, $pts)
            $g.DrawPolygon($pen, $pts)
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 76, 5, 25))
            $g.FillRectangle($bg, [int]($w*0.5), [int]($h*0.15), 220, 42)
            $g.DrawRectangle($pen, [int]($w*0.5), [int]($h*0.15), 220, 42)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 205, 211))
            $g.DrawString("FLOOD INUNDATION EXTENT", $font, $tBrush, [float]($w*0.5 + 10), [float]($h*0.15 + 6))
            $wBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.DrawString("142.6 km² Lowland Hazard • 94% Conf", $hudFont, $wBrush, [float]($w*0.5 + 10), [float]($h*0.15 + 24))
        }
        "ndvi" {
            # False-color biophysical tint over agricultural fields
            $ndviBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(90, 34, 197, 94))
            $g.FillRectangle($ndviBrush, 0, 0, $w, $h)
            
            # Draw parcel gradient variations
            $fieldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 234, 179, 8), 1.5)
            for ($x = 50; $x -lt $w; $x += 120) {
                $g.DrawLine($fieldPen, $x, 0, $x, $h)
            }
            for ($y = 40; $y -lt $h; $y += 90) {
                $g.DrawLine($fieldPen, 0, $y, $w, $y)
            }
            
            # Legend HUD
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 11, 17, 32))
            $border = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(34, 197, 94), 1.5)
            $g.FillRectangle($bg, [int]($w - 220), [int]($h - 75), 205, 60)
            $g.DrawRectangle($border, [int]($w - 220), [int]($h - 75), 205, 60)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(248, 250, 252))
            $g.DrawString("NDVI VEGETATION VIGOR", $font, $tBrush, [float]($w - 210), [float]($h - 68))
            $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(74, 222, 128))
            $g.DrawString("Mean NDVI: 0.72 (Optimal Vigor)", $hudFont, $subBrush, [float]($w - 210), [float]($h - 50))
            $barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(234, 179, 8))
            $g.FillRectangle($barBrush, [int]($w - 210), [int]($h - 32), 180, 6)
        }
        "landcover" {
            # Amber change polygons
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(250, 245, 158, 11), 2.5)
            $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(120, 245, 158, 11))
            $g.FillRectangle($brush, [int]($w*0.35), [int]($h*0.4), [int]($w*0.25), [int]($h*0.3))
            $g.DrawRectangle($pen, [int]($w*0.35), [int]($h*0.4), [int]($w*0.25), [int]($h*0.3))
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 69, 26, 3))
            $g.FillRectangle($bg, [int]($w*0.35), [int]($h*0.4 - 32), 170, 28)
            $g.DrawRectangle($pen, [int]($w*0.35), [int]($h*0.4 - 32), 170, 28)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(253, 230, 138))
            $g.DrawString("CHANGE: +14.2 ha BUILT-UP", $font, $tBrush, [float]($w*0.35 + 8), [float]($h*0.4 - 26))
        }
        "cyclone" {
            # Inundation along coastline
            $maskBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110, 239, 68, 68))
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 239, 68, 68), 2.0)
            $pts = @(
                [System.Drawing.Point]::new([int]($w*0.45), 0),
                [System.Drawing.Point]::new([int]($w*0.65), 0),
                [System.Drawing.Point]::new([int]($w*0.5), $h),
                [System.Drawing.Point]::new([int]($w*0.3), $h)
            )
            $g.FillPolygon($maskBrush, $pts)
            $g.DrawPolygon($pen, $pts)
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 69, 10, 10))
            $g.FillRectangle($bg, 30, [int]($h - 65), 210, 42)
            $g.DrawRectangle($pen, 30, [int]($h - 65), 210, 42)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 202, 202))
            $g.DrawString("CYCLONIC STORM SURGE", $font, $tBrush, 40.0, [float]($h - 59))
            $wBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.DrawString("Coastal Inundation Detected", $hudFont, $wBrush, 40.0, [float]($h - 41))
        }
        "infrastructure" {
            # Port and industrial bounding boxes
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 56, 189, 248), 2.0)
            $g.DrawRectangle($pen, [int]($w*0.2), [int]($h*0.3), [int]($w*0.22), [int]($h*0.35))
            $g.DrawRectangle($pen, [int]($w*0.5), [int]($h*0.25), [int]($w*0.28), [int]($h*0.4))
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 8, 47, 73))
            $g.FillRectangle($bg, [int]($w*0.2), [int]($h*0.3 - 26), 140, 24)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(186, 230, 253))
            $g.DrawString("BERTH CONTAINER YARD", $hudFont, $tBrush, [float]($w*0.2 + 6), [float]($h*0.3 - 22))
        }
        "urban" {
            # Orange urban expansion mask
            $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(110, 249, 115, 22))
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 251, 146, 60), 2.0)
            $g.FillRectangle($brush, [int]($w*0.4), [int]($h*0.35), [int]($w*0.35), [int]($h*0.4))
            $g.DrawRectangle($pen, [int]($w*0.4), [int]($h*0.35), [int]($w*0.35), [int]($h*0.4))
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 67, 20, 7))
            $g.FillRectangle($bg, [int]($w*0.4), [int]($h*0.35 - 28), 180, 26)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 215, 170))
            $g.DrawString("URBAN FOOTPRINT +8.4%", $font, $tBrush, [float]($w*0.4 + 8), [float]($h*0.35 - 23))
        }
        "coastal" {
            # Shoreline retreat vector
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 239, 68, 68), 3.0)
            $pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
            $g.DrawLine($pen, [int]($w*0.45), 0, [int]($w*0.52), $h)
            
            $t1Pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 34, 197, 94), 2.0)
            $g.DrawLine($t1Pen, [int]($w*0.48), 0, [int]($w*0.55), $h)
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 15, 23, 42))
            $g.FillRectangle($bg, 30, 30, 210, 44)
            $border = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(239, 68, 68), 1.5)
            $g.DrawRectangle($border, 30, 30, 210, 44)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 202, 202))
            $g.DrawString("COASTAL RETREAT: -14.2m", $font, $tBrush, 40.0, 36.0)
            $wBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
            $g.DrawString("T1 (Green) vs T2 (Red Line)", $hudFont, $wBrush, 40.0, 54.0)
        }
        "airport" {
            # Runway and apron bounding boxes
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 168, 85, 247), 2.0)
            $g.DrawRectangle($pen, [int]($w*0.1), [int]($h*0.35), [int]($w*0.78), 36)
            $g.DrawRectangle($pen, [int]($w*0.15), [int]($h*0.55), [int]($w*0.75), 36)
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 59, 7, 100))
            $g.FillRectangle($bg, [int]($w*0.1), [int]($h*0.35 - 26), 180, 24)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(233, 213, 255))
            $g.DrawString("RUNWAY 29R/11L • CLEAR", $hudFont, $tBrush, [float]($w*0.1 + 8), [float]($h*0.35 - 22))
        }
        "grounding" {
            # Bounding box around refinery crude tanks
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(245, 217, 70, 239), 3.0)
            $g.DrawRectangle($pen, [int]($w*0.3), [int]($h*0.3), [int]($w*0.38), [int]($h*0.42))
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 74, 4, 78))
            $g.FillRectangle($bg, [int]($w*0.3), [int]($h*0.3 - 32), 220, 28)
            $g.DrawRectangle($pen, [int]($w*0.3), [int]($h*0.3 - 32), 220, 28)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(245, 208, 254))
            $g.DrawString("[GROUNDED: STORAGE TANKS]", $font, $tBrush, [float]($w*0.3 + 8), [float]($h*0.3 - 26))
        }
        "drought" {
            # Perimeter shrinkage overlay
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(240, 234, 179, 8), 2.5)
            $pen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
            $g.DrawEllipse($pen, [int]($w*0.25), [int]($h*0.25), [int]($w*0.5), [int]($h*0.5))
            
            $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 66, 32, 6))
            $g.FillRectangle($bg, [int]($w*0.25), [int]($h*0.25 - 32), 200, 28)
            $g.DrawRectangle($pen, [int]($w*0.25), [int]($h*0.25 - 32), 200, 28)
            $tBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(254, 240, 138))
            $g.DrawString("SURFACE WATER -38.4%", $font, $tBrush, [float]($w*0.25 + 8), [float]($h*0.25 - 26))
        }
    }

    $g.Dispose()
    $bmp.Dispose()
    $outBmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $outBmp.Dispose()
    Write-Host "Created $targetName ($overlayType overlay)"
}

Create-OverlayImage "water-optical.jpg" "water-result.jpg" "water"
Create-OverlayImage "flood.jpg" "flood-result.jpg" "flood"
Create-OverlayImage "vegetation-optical.jpg" "vegetation-ndvi.jpg" "ndvi"
Create-OverlayImage "landcover-before.jpg" "landcover-after.jpg" "landcover"
Create-OverlayImage "landcover-after.jpg" "landcover-change.jpg" "landcover"
Create-OverlayImage "cyclone.jpg" "cyclone-result.jpg" "cyclone"
Create-OverlayImage "infrastructure.jpg" "infrastructure-result.jpg" "infrastructure"
Create-OverlayImage "urban-before.jpg" "urban-result.jpg" "urban"
Create-OverlayImage "coastal-before.jpg" "coastal-result.jpg" "coastal"
Create-OverlayImage "airport.jpg" "airport-result.jpg" "airport"
Create-OverlayImage "sundarbans.jpg" "sundarbans-result.jpg" "water"
Create-OverlayImage "grounding.jpg" "grounding-result.jpg" "grounding"
Create-OverlayImage "drought-before.jpg" "drought-after.jpg" "drought"
Create-OverlayImage "drought-after.jpg" "drought-result.jpg" "drought"

# 4. Create Category Strips
Copy-ImageFile "water-optical.jpg" "category-all.jpg"
Copy-ImageFile "delhi_airport.jpg" "category-single.jpg"
Copy-ImageFile "landcover-change.jpg" "category-change.jpg"
Copy-ImageFile "water-sar.jpg" "category-optical-sar.jpg"
Copy-ImageFile "bengaluru_urban.jpg" "category-scene.jpg"

Write-Host "ALL SATELLITE ASSETS SUCCESSFULLY GENERATED!"
