# Issue #105 — Private document controls and rollout gates

Status: implemented development slice, awaiting current-head CI and staging acceptance. This is not a claim that previously public files have been remediated.

## Application changes

- New/replacement service compliance uploads use the explicit Laravel `local` disk under `services/private-documents/`. That disk is rooted outside the public tree. The public disk remains for explicitly public images.
- Service document serialization hides `file_path`. `file_url` is an authenticated admin download route, never a raw public or external URL. The download checks active user, service permission, actual item/document relationship and active assigned branch. Only private-namespace files on the local disk are served, as attachments with private/no-store caching and nosniff.
- Legacy `services/documents/` and external URL records do not receive a download link and are refused by the private endpoint. Authorized replacement/deletion retains cleanup of legacy public uploads; there is no public-disk download fallback.
- Bike document links continue requiring a valid signature AND now require an active authenticated user. Customers need an owned active booking, matching the status gate used when links are minted. Cancellation/return/expiry revokes subsequent access even if a link has not expired. Managers/staff need bike-service permission and access to the current physical branch; the home branch alone does not grant access. Missing private files return 404 without exposing storage paths or reading a configured public default disk.
- Credential/deployment guidance from PR #3 is incorporated: shared password examples removed, no web-based Artisan/migration runner, private files excluded from public storage guidance, and explicit off-site private-file backup/restore requirements. This does not rotate credentials or remove Git history.

## Blocking operator steps before deployment

1. Identify the exact staging/release SHA and isolated target. Take encrypted database AND private/public-upload backups outside the web root and verify restoration. Never run destructive seeders to fix this issue.
2. Restrict direct web access to legacy service document paths at the hosting/CDN layer before relying on application access controls. Inspect inventory privately: counts and internal record IDs only in shared logs.
3. For every legacy document, verify its owner/item/branch, copy its bytes into the private namespace with a new non-public path, verify a checksum and protected download, then update the metadata under a reviewed recovery plan. Only after verifying recovery and access should an authorized operator quarantine/remove public originals and invalidate public caches. Treat formerly public URLs as disclosed. Do not automatically follow arbitrary external URLs or silently delete records.
4. Verify `FILESYSTEM_DISK` and local disk root/visibility, web root and symlinks. New compliance uploads must never appear under public storage. Review separate condition-photo/signature/KYC paths as remaining #105 scope.
5. Rotate any deployed accounts that used published/test credentials, revoke exposed sessions/tokens, review MFA and privileges through authorized administrative tools. Do not post credentials in GitHub/chat; this commit performs no account changes.
6. Test desktop/mobile authenticated downloads: correct staff, foreign branch/service, customer, guest, blacklisted account, inactive branch, revoked booking, expired signature, missing file and legacy URL. Confirm public images still work and all seven service admin flows remain usable.
7. Record migration/quarantine counts, backup/restore evidence, deployed SHA, redacted access-test results and reviewer sign-off in #105. Keep #105 open until legacy remediation, remaining privacy/retention requirements and complete acceptance are fulfilled.
