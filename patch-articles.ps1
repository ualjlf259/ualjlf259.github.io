$file = "c:\Users\josel\OneDrive\Escritorio\BLOG ANIME\index (1).html"
$content = Get-Content $file -Raw -Encoding UTF8

# ── 1. Add img_top + img_mid to each article, right after its 'meta:' line ──
$articles = @{
  'op-obra'             = @{ top='op-obra-top.jpg';             cap_top='One Piece — Oda, 1997–presente.';               mid='op-obra-mid.jpg';             cap_mid='Nico Robin en Enies Lobby: «¡Quiero vivir!»' }
  'op-esclavitud'       = @{ top='op-esclavitud-top.jpg';       cap_top='Los Dragones Celestiales: el privilegio absoluto.'; mid='op-esclavitud-mid.jpg';       cap_mid='Fisher Tiger: el liberador que la historia olvidó.' }
  'hxh-capitalismo'     = @{ top='hxh-capitalismo-top.jpg';     cap_top='Meruem y Komugi: el poder frente a la conexión.'; mid='hxh-capitalismo-mid.jpg';     cap_mid='La transformación de Gon: cuando el héroe cruza la línea.' }
  'vinland-guerra'      = @{ top='vinland-guerra-top.jpg';      cap_top='Vinland Saga — Makoto Yukimura. La épica más honesta.'; mid='vinland-guerra-mid.jpg';      cap_mid='Thorfinn y Askeladd: la relación más compleja del manga.' }
  'aot-libertad'        = @{ top='aot-libertad-top.jpg';        cap_top='Los muros: la prisión que la humanidad construyó.'; mid='aot-libertad-mid.jpg';        cap_mid='El Rugido de la Tierra: consecuencia de un mundo sin diplomacia.' }
  'naruto-ciclo-odio'   = @{ top='naruto-ciclo-odio-top.jpg';   cap_top='Naruto vs. Pain: el debate más político del shonen.'; mid='naruto-ciclo-odio-mid.jpg';   cap_mid='Itachi Uchiha: el hombre que cargó solo con el peso del mundo.' }
  'death-note-justicia' = @{ top='death-note-justicia-top.jpg'; cap_top='Light Yagami: el genio que confundió el poder con la justicia.'; mid='death-note-justicia-mid.jpg'; cap_mid='L: el argumento más poderoso contra la justicia unilateral.' }
  'jjk-maldicion'       = @{ top='jjk-maldicion-top.jpg';       cap_top='Ryomen Sukuna: la maldición nacida de siglos de miedo.'; mid='jjk-maldicion-mid.jpg';       cap_mid='Gojo Satoru: el hombre más poderoso del mundo, y el más solo.' }
  'mha-heroes'          = @{ top='mha-heroes-top.jpg';          cap_top='Midoriya: el héroe que el sistema descartó.';     mid='mha-heroes-mid.jpg';          cap_mid='All Might: el símbolo que ocultaba el peso de un sistema roto.' }
  'db-esfuerzo'         = @{ top='db-esfuerzo-top.jpg';         cap_top='Dragon Ball — el evangelio del esfuerzo.';       mid='db-esfuerzo-mid.jpg';         cap_mid='Vegeta: la lucha más honesta contra los propios límites.' }
}

foreach ($id in $articles.Keys) {
  $data = $articles[$id]
  $srcTop = "img/articles/$($data.top)"
  $srcMid = "img/articles/$($data.mid)"
  $capTop = $data.cap_top
  $capMid = $data.cap_mid

  # Build the img_top / img_mid block to insert after meta:
  $insert = @"
    img_top: { src: '$srcTop', caption: '$capTop' },
    img_mid: { src: '$srcMid', caption: '$capMid' },
"@

  # Match the meta line for this article and insert after it
  # meta line looks like: meta: '... · Jose Jesus Lopez Fernandez',
  # We need the meta line that follows tag: 'ONE PIECE...' for THIS article
  # Strategy: find "'$id'" then find the next meta line and insert after it
  $pattern = "(?<='$id'[\s\S]{0,600}?meta: '[^']*?')(?=\s*\r?\n\s*body:)"
  if ($content -match $pattern) {
    $content = $content -replace $pattern, ",`n$insert"
    Write-Host "Added img props to: $id"
  } else {
    Write-Host "WARNING: could not match meta for $id"
  }
}

# ── 2. Remove Wikipedia <img> tags from article bodies ──
# Pattern: <img class="article-img" src="https://upload.wikimedia.org/...">
# and the following <p class="article-img-caption">...</p>
$imgTagPattern = '\r?\n\s*<img class="article-img"[^>]+onerror="this\.style\.display=''none''">\r?\n\s*<p class="article-img-caption">[^<]*</p>'
$count = ([regex]::Matches($content, $imgTagPattern)).Count
Write-Host "Found $count Wikipedia img+caption blocks to process"

# Replace first occurrence in each article body with {{MID_IMG}}, second with nothing
# Simpler: replace ALL with {{MID_IMG}} first, then replace second {{MID_IMG}} in each body with empty
$content = $content -replace $imgTagPattern, "`n      {{MID_IMG}}"
Write-Host "Replaced Wikipedia img tags with {{MID_IMG}}"

# Now each article body has 2 {{MID_IMG}} tokens.
# Keep the FIRST one (it's the mid image slot), remove the SECOND.
# Do this per article by processing each body block
$bodyPattern = "(?<=body: ``)([\s\S]*?)(?=``\s*\r?\n\s*[},])"
$content = [regex]::Replace($content, $bodyPattern, {
  param($m)
  $body = $m.Value
  $first = $true
  $body = [regex]::Replace($body, '\{\{MID_IMG\}\}', {
    param($m2)
    if ($first) { $first = $false; return '{{MID_IMG}}' }
    return ''
  })
  return $body
})

Write-Host "Deduplicated {{MID_IMG}} tokens"

# ── 3. Write back ──
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Done. File saved."
