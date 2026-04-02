param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Escape-PdfText {
    param([string]$Text)

    $escaped = $Text.Replace('\', '\\')
    $escaped = $escaped.Replace('(', '\(')
    $escaped = $escaped.Replace(')', '\)')
    return $escaped
}

function Wrap-Line {
    param(
        [string]$Text,
        [int]$Width = 88
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return @('')
    }

    $words = $Text -split '\s+'
    $buffer = ''
    $result = New-Object System.Collections.Generic.List[string]

    foreach ($word in $words) {
        if ([string]::IsNullOrEmpty($buffer)) {
            $buffer = $word
            continue
        }

        if (($buffer.Length + 1 + $word.Length) -le $Width) {
            $buffer = "$buffer $word"
        }
        else {
            $result.Add($buffer)
            $buffer = $word
        }
    }

    if (-not [string]::IsNullOrEmpty($buffer)) {
        $result.Add($buffer)
    }

    return $result
}

function Convert-MarkdownLine {
    param([string]$Line)

    $trimmed = $Line.TrimEnd()

    if ($trimmed -match '^###\s+(.*)$') {
        return "   $($Matches[1].ToUpper())"
    }

    if ($trimmed -match '^##\s+(.*)$') {
        return " $($Matches[1].ToUpper())"
    }

    if ($trimmed -match '^#\s+(.*)$') {
        return $Matches[1].ToUpper()
    }

    if ($trimmed -match '^\-\s+(.*)$') {
        return "- $($Matches[1])"
    }

    if ($trimmed -match '^\d+\.\s+(.*)$') {
        return "* $($Matches[1])"
    }

    return $trimmed
}

$inputAbsolute = (Resolve-Path $InputPath).Path
$outputAbsolute = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Path $outputAbsolute -Parent

if (-not (Test-Path $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

$rawLines = Get-Content -Path $inputAbsolute
$preparedLines = New-Object System.Collections.Generic.List[string]

foreach ($line in $rawLines) {
    $converted = Convert-MarkdownLine -Line $line
    $wrapped = Wrap-Line -Text $converted

    foreach ($wrappedLine in $wrapped) {
        $preparedLines.Add($wrappedLine)
    }

    if ($line.Trim().StartsWith('#') -or [string]::IsNullOrWhiteSpace($line)) {
        $preparedLines.Add('')
    }
}

$linesPerPage = 44
$pages = @()
for ($i = 0; $i -lt $preparedLines.Count; $i += $linesPerPage) {
    $take = [Math]::Min($linesPerPage, $preparedLines.Count - $i)
    $pages += ,($preparedLines.GetRange($i, $take))
}

$objects = New-Object System.Collections.Generic.List[string]
$objects.Add("<< /Type /Catalog /Pages 2 0 R >>")
$objects.Add("<< /Type /Pages /Count $($pages.Count) /Kids [__KIDS__] >>")
$objects.Add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

$pageObjectNumbers = New-Object System.Collections.Generic.List[int]
$contentObjectNumbers = New-Object System.Collections.Generic.List[int]

foreach ($page in $pages) {
    $pageObjectNumbers.Add($objects.Count + 1)
    $objects.Add('')
    $contentObjectNumbers.Add($objects.Count + 1)
    $objects.Add('')
}

$kids = ($pageObjectNumbers | ForEach-Object { "$_ 0 R" }) -join ' '
$objects[1] = $objects[1].Replace('__KIDS__', $kids)

for ($pageIndex = 0; $pageIndex -lt $pages.Count; $pageIndex++) {
    $pageObjectNumber = $pageObjectNumbers[$pageIndex]
    $contentObjectNumber = $contentObjectNumbers[$pageIndex]

    $streamLines = New-Object System.Collections.Generic.List[string]
    $streamLines.Add('BT')
    $streamLines.Add('/F1 11 Tf')
    $streamLines.Add('14 TL')
    $streamLines.Add('50 780 Td')

    foreach ($line in $pages[$pageIndex]) {
        $escaped = Escape-PdfText -Text $line
        $streamLines.Add("($escaped) Tj")
        $streamLines.Add('T*')
    }

    $streamLines.Add('ET')
    $stream = ($streamLines -join "`n")
    $length = [System.Text.Encoding]::ASCII.GetByteCount($stream)

    $objects[$pageObjectNumber - 1] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents $contentObjectNumber 0 R >>"
    $objects[$contentObjectNumber - 1] = "<< /Length $length >>`nstream`n$stream`nendstream"
}

$builder = New-Object System.Text.StringBuilder
[void]$builder.AppendLine('%PDF-1.4')

$offsets = New-Object System.Collections.Generic.List[int]
$offsets.Add(0)

for ($index = 0; $index -lt $objects.Count; $index++) {
    $offsets.Add($builder.Length)
    [void]$builder.AppendLine("$($index + 1) 0 obj")
    [void]$builder.AppendLine($objects[$index])
    [void]$builder.AppendLine('endobj')
}

$xrefStart = $builder.Length
[void]$builder.AppendLine("xref")
[void]$builder.AppendLine("0 $($objects.Count + 1)")
[void]$builder.AppendLine("0000000000 65535 f ")

for ($i = 1; $i -le $objects.Count; $i++) {
    [void]$builder.AppendLine(("{0:0000000000} 00000 n " -f $offsets[$i]))
}

[void]$builder.AppendLine("trailer")
[void]$builder.AppendLine("<< /Size $($objects.Count + 1) /Root 1 0 R >>")
[void]$builder.AppendLine("startxref")
[void]$builder.AppendLine("$xrefStart")
[void]$builder.AppendLine("%%EOF")

[System.IO.File]::WriteAllText($outputAbsolute, $builder.ToString(), [System.Text.Encoding]::ASCII)
Write-Output $outputAbsolute
