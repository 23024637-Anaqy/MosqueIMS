$token = "550770e0-d556-4f33-bd6e-fe96926df91d"
$startDate = (Get-Date).AddDays(-30).ToString('yyyy-MM-dd')
$endDate = (Get-Date).ToString('yyyy-MM-dd')

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$url = "http://localhost:4000/api/reports?startDate=$startDate&endDate=$endDate"

Write-Host "Testing Reports Endpoint"
Write-Host "URL: $url"
Write-Host "Token: $token"
Write-Host ""

$response = Invoke-WebRequest -Uri $url -Headers $headers -ContentType 'application/json'
Write-Host "Status: $($response.StatusCode)"
Write-Host "Response:"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
