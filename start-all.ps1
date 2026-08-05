<#
.SYNOPSIS
    Starts every HustleHub backend microservice in its own PowerShell window.

.DESCRIPTION
    Local dev convenience only - no Docker involved. Opens one window per service so you can
    watch each one's logs independently and Ctrl+C any single service without killing the rest.
    Run from anywhere; paths below are resolved relative to this script's own location.

    Order doesn't strictly matter (each service tolerates the others being down - identity-service
    calls only itself when needed, and the gateway/tasks/messaging services degrade to a clear
    503 rather than crashing if a dependency isn't up yet), but starting the gateway last means
    its first requests are more likely to find everything else already listening.
#>

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$services = @(
    @{ Name = "identity-service";      Dir = "services\identity-service" },
    @{ Name = "tasks-service";         Dir = "services\tasks-service" },
    @{ Name = "messaging-service";     Dir = "services\messaging-service" },
    @{ Name = "notifications-service"; Dir = "services\notifications-service" },
    @{ Name = "payments-service";      Dir = "services\payments-service" },
    @{ Name = "rentals-service";       Dir = "services\rentals-service" },
    @{ Name = "reviews-service";       Dir = "services\reviews-service" },
    @{ Name = "gateway-service";       Dir = "services\gateway-service" }
)

foreach ($svc in $services) {
    $dir = Join-Path $root $svc.Dir
    Write-Host "Starting $($svc.Name) ..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$dir'; ./mvnw.cmd spring-boot:run" -WindowStyle Normal
}

Write-Host ""
Write-Host "All eight services are launching in separate windows:"
Write-Host "  gateway-service        -> http://localhost:8080  (this is what the app talks to)"
Write-Host "  identity-service       -> http://localhost:8181"
Write-Host "  tasks-service          -> http://localhost:8182"
Write-Host "  messaging-service      -> http://localhost:8183"
Write-Host "  notifications-service  -> http://localhost:8184"
Write-Host "  payments-service       -> http://localhost:8185"
Write-Host "  rentals-service        -> http://localhost:8186"
Write-Host "  reviews-service        -> http://localhost:8187"
Write-Host ""
Write-Host "Each takes 15-60s to finish booting (Flyway + JPA startup). Close a window (or Ctrl+C inside it) to stop that service."
