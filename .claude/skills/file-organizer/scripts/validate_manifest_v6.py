#!/usr/bin/env python3
"""file-organizer reference preflight validator v6-ref-1.
Requires jsonschema. For RFC 8785 canonicalization, requires the `jcs` Python package.
Exit 0 only for validator_status PASS with zero blocking findings.
"""
import argparse, hashlib, json, sys
VERSION="v6-ref-1"

def finding(code, message):
    return {"severity":"BLOCKING","code":code,"message":message}

def semantic(m):
    f=[]
    actions=m.get("actions",[])
    seq=[a.get("seq") for a in actions]
    if seq != list(range(1,len(actions)+1)):
        f.append(finding("SEQ","seq must be contiguous, unique, ordered from 1"))
    if m.get("declared_counts",{}).get("actions") != len(actions):
        f.append(finding("COUNT_ACTIONS","declared action count mismatch"))
    if m.get("declared_counts",{}).get("review_items") != len(m.get("review_items",[])):
        f.append(finding("COUNT_REVIEW","declared review count mismatch"))
    created=set()
    for a in actions:
        op=a.get("op"); dst=a.get("destination")
        if op=="CREATE_DIRECTORY" and dst:
            created.add(dst.rstrip("\\/").lower())
        if op in ("MOVE","RENAME") and dst:
            parent=dst.replace("\\","/").rsplit("/",1)[0].lower()
            # Parent must either be created earlier or be represented by execution scope;
            # exact availability beyond manifest is an environment preflight responsibility.
            if parent and parent not in created and "destination_parent_preexisting" not in a:
                f.append(finding("PARENT","move/rename destination parent not created earlier or declared preexisting"))
        if a.get("duplicate_state")=="HOLD_FOR_REVIEW":
            f.append(finding("HOLD_EXECUTABLE","HOLD_FOR_REVIEW cannot be executable"))
    return f

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("manifest"); ap.add_argument("schema")
    args=ap.parse_args()
    out={"validator_version":VERSION,"validator_status":"FAIL","findings":[]}
    try:
        import jsonschema
        try:
            import jcs
        except Exception:
            out["validator_status"]="NHR"
            out["findings"]=[finding("JCS_UNAVAILABLE","RFC 8785 jcs package unavailable")]
            print(json.dumps(out,separators=(",",":"))); return 2
        raw=open(args.manifest,"rb").read()
        m=json.loads(raw); sch=json.load(open(args.schema,encoding="utf-8"))
        jsonschema.validate(m,sch)
        out["findings"]=semantic(m)
        if out["findings"]:
            print(json.dumps(out,separators=(",",":"))); return 1
        canonical=jcs.canonicalize(m)
        out.update({
            "validator_status":"PASS",
            "input_sha256":hashlib.sha256(raw).hexdigest().upper(),
            "canonical_sha256":hashlib.sha256(canonical).hexdigest().upper(),
            "canonical_length":len(canonical),
            "findings":[]
        })
        print(json.dumps(out,separators=(",",":"))); return 0
    except Exception as e:
        out["findings"]=[finding("VALIDATOR_ERROR",type(e).__name__+": "+str(e))]
        print(json.dumps(out,separators=(",",":"))); return 2
if __name__=="__main__": sys.exit(main())
