$ErrorActionPreference = 'Stop'
$base='http://localhost/MyPortfolio/academic-scheduler/backend/api'
$body=@{student_code='PTEST25'; first_name='Persistent'; last_name='Student'; current_level='Level 1'; enrollment_status='Active'}
$json= $body | ConvertTo-Json
Write-Host "Posting create_student..."
$r = Invoke-RestMethod -Uri ($base + '/create_student.php') -Method Post -ContentType 'application/json' -Body $json
$r | ConvertTo-Json -Depth 5 | Write-Host
if ($r.success) { Write-Host "Created id: $($r.id)" }
