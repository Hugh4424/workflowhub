# P4 test strategy

- RED: source drift returned `REVIEW_SOURCE_DRIFT`; expected cancel call was absent.
- GREEN: full managed lifecycle suite 31/31 pass.
- Negative coverage: temporary status unavailable, live polling, wall-clock wait exceeded, final boundary recheck, completed terminal, and member health failure all remain no-cancel.
