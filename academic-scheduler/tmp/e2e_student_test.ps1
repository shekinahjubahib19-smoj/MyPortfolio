$ErrorActionPreference = 'Stop'
$base='http://localhost/MyPortfolio/academic-scheduler/backend/api'

function pretty($obj) { $obj | ConvertTo-Json -Depth 10 }

Write-Host "== CREATE =="
$body=@{student_code='E2E20260525'; first_name='E2ETest'; last_name='User'; current_level='Level 1'; enrollment_status='Active'}
$json= $body | ConvertTo-Json
$r = Invoke-RestMethod -Uri ($base + '/create_student.php') -Method Post -ContentType 'application/json' -Body $json
pretty $r | Write-Host
$createdId = $r.id

Write-Host "`n== LIST =="
$l = Invoke-RestMethod -Uri ($base + '/list_students.php') -Method Get
pretty $l | Write-Host

Write-Host "`n== UPDATE =="
$updateBody=@{id = $createdId; student_code='E2E20260525'; first_name='E2ETestUpdated'; last_name='User'; current_level='Level 2'; enrollment_status='Active'}
$uj = $updateBody | ConvertTo-Json
$u = Invoke-RestMethod -Uri ($base + '/update_student.php') -Method Post -ContentType 'application/json' -Body $uj
pretty $u | Write-Host

Write-Host "`n== LIST (after update) =="
$l2 = Invoke-RestMethod -Uri ($base + '/list_students.php') -Method Get
pretty $l2 | Write-Host

Write-Host "`n== DELETE =="
$delBody=@{id=$createdId}
$dj = $delBody | ConvertTo-Json
$d = Invoke-RestMethod -Uri ($base + '/delete_student.php') -Method Post -ContentType 'application/json' -Body $dj
pretty $d | Write-Host

Write-Host "`n== LIST (after delete) =="
$lf = Invoke-RestMethod -Uri ($base + '/list_students.php') -Method Get
pretty $lf | Write-Host

Write-Host "`nE2E test completed"
