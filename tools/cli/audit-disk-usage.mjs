import {auditTaskDiskUsage} from '../../runtime/evidence/disk-budget.mjs';
import {isAbsolute} from 'node:path';
const args=process.argv.slice(2);
try{if(args.length!==2||args[0]!=='--task-root'||!isAbsolute(args[1]))throw new Error('usage: --task-root ABSOLUTE_TASK_ROOT (read only)');process.stdout.write(JSON.stringify(auditTaskDiskUsage(args[1]),null,2)+'\n');}
catch(error){process.stderr.write(JSON.stringify({code:error.code??'DISK_AUDIT_FAILED',message:error.message})+'\n');process.exitCode=1;}
