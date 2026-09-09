Add-Type -AssemblyName System.Drawing
$bitmap = New-Object System.Drawing.Bitmap 1200,630
$canvas = [System.Drawing.Graphics]::FromImage($bitmap)
$canvas.SmoothingMode = 'AntiAlias'
$canvas.TextRenderingHint = 'AntiAliasGridFit'
$rect = New-Object System.Drawing.Rectangle 0,0,1200,630
$gradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect,([System.Drawing.ColorTranslator]::FromHtml('#0d0f12')),([System.Drawing.ColorTranslator]::FromHtml('#243d5c')),25
$canvas.FillRectangle($gradient,$rect)
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#f1f5fa'))
$blue = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#72a8db'))
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#bac7d7'))
$large = New-Object System.Drawing.Font 'Arial',76,([System.Drawing.FontStyle]::Bold),([System.Drawing.GraphicsUnit]::Pixel)
$small = New-Object System.Drawing.Font 'Arial',28,([System.Drawing.FontStyle]::Regular),([System.Drawing.GraphicsUnit]::Pixel)
$caption = New-Object System.Drawing.Font 'Arial',20,([System.Drawing.FontStyle]::Regular),([System.Drawing.GraphicsUnit]::Pixel)
$canvas.DrawString('UNIFACISA  /  TITANIC · 1912',$caption,$muted,76,62)
$canvas.DrawString('Sobrevivência',$large,$white,70,162)
$canvas.DrawString('e Classe',$large,$blue,70,248)
$canvas.DrawString('Uma leitura humana, visual e estatística.',$small,$white,76,376)
$canvas.DrawString('891 registros · Gráficos interativos · Cálculos explicados',$caption,$muted,76,438)
$pen = New-Object System.Drawing.Pen ([System.Drawing.ColorTranslator]::FromHtml('#547899')),1
$canvas.DrawLine($pen,76,510,1124,510)
$canvas.DrawString('Análise Estatística Descritiva',$caption,$muted,76,542)
$canvas.DrawString('Prof. Onildo dos Reis Freire',$caption,$muted,820,542)
$bitmap.Save((Join-Path $PSScriptRoot 'public/design-system/share-titanic.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$pen.Dispose(); $large.Dispose(); $small.Dispose(); $caption.Dispose()
$white.Dispose(); $blue.Dispose(); $muted.Dispose(); $gradient.Dispose(); $canvas.Dispose(); $bitmap.Dispose()
