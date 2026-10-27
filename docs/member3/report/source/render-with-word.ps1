param([Parameter(Mandatory=$true)][string]$SourcePath, [Parameter(Mandatory=$true)][string]$PdfPath)
$ErrorActionPreference = 'Stop'
$wordRender = $null
$renderDocument = $null
try {
  $sourceResolved = (Resolve-Path -LiteralPath $SourcePath).Path
  $pdfAbsolute = [IO.Path]::GetFullPath($PdfPath)
  [void][IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($pdfAbsolute))
  $wordRender = New-Object -ComObject Word.Application
  if ($wordRender.Documents.Count -ne 0) { throw 'The rendering instance has unrelated open documents; export was not started.' }
  $wordRender.Visible = $false
  $wordRender.DisplayAlerts = 0
  $wordRender.AutomationSecurity = 3
  $renderDocument = $wordRender.Documents.Open($sourceResolved, $false, $true, $false)
  $renderDocument.Repaginate()
  $pageCount = $renderDocument.ComputeStatistics(2)
  $renderDocument.ExportAsFixedFormat($pdfAbsolute, 17)
  [pscustomobject]@{ renderer = 'Microsoft Word 16'; pages = $pageCount; source = $sourceResolved; pdf = $pdfAbsolute } | ConvertTo-Json -Compress
} finally {
  if ($null -ne $renderDocument) {
    $renderDocument.Close(0)
    [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($renderDocument)
  }
  if ($null -ne $wordRender) {
    if ($wordRender.Documents.Count -eq 0) { $wordRender.Quit(0) }
    [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($wordRender)
  }
}
