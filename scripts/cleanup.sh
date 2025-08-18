# scripts/cleanup.sh
set -euo pipefail

RG="rg -n"   # ripgrep is fast; install if missing

exists() { [[ -e "$1" || -d "$1" ]]; }
refs_in_src() { $RG -q "$1" src || return 1; }

del_if_unused() {
  local path="$1" match="${2:-}"
  if ! exists "$path"; then echo "skip (missing): $path"; return; fi
  if [[ -n "$match" ]] && refs_in_src "$match"; then
    echo "KEEP (refs found): $path"
  else
    git rm -rf "$path" 2>/dev/null || rm -rf "$path"
    echo "DELETED: $path"
  fi
}

move_to_docs() {
  local path="$1"
  if exists "$path"; then
    mkdir -p docs
    git mv "$path" docs/ 2>/dev/null || mv "$path" docs/
    echo "MOVED → docs/: $path"
  fi
}

echo "=== Frontend: legacy/unused files ==="
# Old API client (you now use inline fetch)
del_if_unused "src/api.ts" "from .*api|import .*api"

# Old panels (only delete if not imported anywhere)
del_if_unused "src/components/ui/MetricsPanel.tsx" "MetricsPanel"
del_if_unused "src/components/ui/ModelStatus.tsx"   "ModelStatus"
del_if_unused "src/components/ui/PredictionResult.tsx" "PredictionResult"

# Unused page (if not routed)
del_if_unused "src/pages/AdminDashboard.tsx" "AdminDashboard"

echo "=== Frontend: shadcn extras rarely used (delete if not imported) ==="
for f in hover-card input-otp menubar pagination popover progress radio-group resizable; do
  del_if_unused "src/components/ui/$f.tsx" "components/ui/$f"
done

echo "=== Backend: alternate stack / artifacts ==="
# Old FastAPI backend folder (delete if you’re now on Flask only)
del_if_unused "fastapi-backend" "fastapi-backend"

echo "=== Move large artifacts/docs out of root (kept, not deleted) ==="
move_to_docs "fraud - fraud.csv"
move_to_docs "fraud_case_study.docx"
move_to_docs "gb_model.pkl"   # not used by Flask app (uses model.joblib)

echo "=== Done ==="
echo "Tip: remove stray unused imports (e.g., Boolean/OperationalError) in app.py if your linter flags them."
