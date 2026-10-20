import {describe,it,expect} from 'vitest';
import {existsSync} from 'node:fs';
import {evaluateEntryRoute} from '../../workflows/make-decision/scripts/entry-evaluation.mjs';
// Frozen against evaluateMiniTaskScope before retirement; only the named choices branding changes.
const legacyCases = [
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": false,
      "security": false
    },
    "expected": {
      "status": "suitable",
      "user_requested": false,
      "risks": [],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {},
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task suitability is not established; unassessed or invalid evidence: boundary_clear: missing assessment; single_outcome: missing assessment; limited_impact: missing assessment; major_architecture: missing assessment; migration: missing assessment; permission: missing assessment; security: missing assessment; false flags for these items are placeholders, not evidence of absent risk",
      "expanded_risks": [],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": false,
        "single_outcome": false,
        "limited_impact": false,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": true,
      "migration": false,
      "permission": false,
      "security": false
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task scope includes materially expanded risks: major_architecture; an explicit route choice is required",
      "expanded_risks": [
        "major_architecture"
      ],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": true,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": true,
      "permission": false,
      "security": false
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task scope includes materially expanded risks: migration; an explicit route choice is required",
      "expanded_risks": [
        "migration"
      ],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": true,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": true,
      "security": false
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task scope includes materially expanded risks: permission; an explicit route choice is required",
      "expanded_risks": [
        "permission"
      ],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": true,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": false,
      "security": true
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task scope includes materially expanded risks: security; an explicit route choice is required",
      "expanded_risks": [
        "security"
      ],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": true
      }
    }
  },
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": true,
      "security": false,
      "permissionRisk": false
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task scope includes materially expanded risks: permission; an explicit route choice is required; unassessed or invalid evidence: permission: conflicting aliases; false flags for these items are placeholders, not evidence of absent risk",
      "expanded_risks": [
        "permission"
      ],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": true,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": false,
      "security": "no"
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task suitability is not established; unassessed or invalid evidence: security: non-boolean assessment; false flags for these items are placeholders, not evidence of absent risk",
      "expanded_risks": [],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": false,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": false,
      "security": false
    },
    "expected": {
      "status": "paused",
      "user_requested": false,
      "reason": "mini-task suitability is not established",
      "expanded_risks": [],
      "choices": [
        "shrink-mini-task",
        "create-ordinary-five-stage-task"
      ],
      "flags": {
        "boundary_clear": false,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundary_clear": false,
      "single_outcome": true,
      "limited_impact": true,
      "major_architecture": false,
      "migration": false,
      "permission": false,
      "security": false,
      "user_requested": true
    },
    "expected": {
      "status": "suitable_with_risk",
      "user_requested": true,
      "risks": [
        "需求边界或影响面需要持续监控"
      ],
      "execution_boundary": "若执行中继续扩大，必须重新评估并暂停让用户选择",
      "flags": {
        "boundary_clear": false,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  },
  {
    "input": {
      "boundaryClear": true,
      "singleOutcome": true,
      "limitedImpact": true,
      "majorArchitecture": false,
      "migrationRisk": false,
      "permissionRisk": false,
      "securityRisk": false
    },
    "expected": {
      "status": "suitable",
      "user_requested": false,
      "risks": [],
      "flags": {
        "boundary_clear": true,
        "single_outcome": true,
        "limited_impact": true,
        "major_architecture": false,
        "migration": false,
        "permission": false,
        "security": false
      }
    }
  }
];
describe('ORACLE-ENTRY-FUNCTION',()=>{
 it.each(legacyCases.map((entry,i)=>[i,entry]))('preserves legacy input/output semantics case %s',(_i,{input,expected})=>{
 const actual=evaluateEntryRoute(input);
 const migrated=structuredClone(expected);
 if(migrated.choices) migrated.choices=['shrink-scope','create-ordinary-five-stage-task'];
 expect(actual).toEqual(migrated);
 expect(Object.isFrozen(actual)).toBe(true);
 });
 it.each([null,[],true,'invalid',3])('rejects non-object input %j',input=>{expect(()=>evaluateEntryRoute(input)).toThrow(TypeError);});
 it('retains the historical mini route ADR as read-only context',()=>{expect(existsSync(new URL('../../docs/adr/0013-mini-task-compact-delivery-flow.md',import.meta.url))).toBe(true);});
 it('T006 retires the old executable module',async()=>{
 expect(existsSync(new URL('../../skills/mini-task/scripts/mini-task-runner.mjs',import.meta.url))).toBe(false);
 await expect(import('../../skills/mini-task/scripts/mini-task-runner.mjs')).rejects.toThrow();
 });
});
