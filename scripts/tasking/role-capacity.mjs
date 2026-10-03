// CAPACITY, not precedence. Roles are instanced, and how many may hold one is a property
// of the role's write-set, not of taste.
//
//   unbounded   disjoint write-sets; scale freely
//   1           a lock, or files two agents would collide on immediately
//
// There is deliberately NO ordering of the roles. The intuitive plan - fill the admin
// roles first, then start workers - is wrong here and costs a session of reviewer time,
// because reviewers read a queue that already exists while task authors have nothing to
// do until workers find something.
//
// Sourced from the write-set tables in tasking/roles/*.md. If you change a role's
// write-set, change its capacity here too, or the roster will permit a collision the
// role files forbid.

export const CAPACITY = {
  WORKER: {
    max: Infinity,
    note: 'each agent owns its own task folder and mailbox; scale freely',
  },
  REVIEWER: {
    max: Infinity,
    note: 'each writes its own verdict file; partition the queue',
  },
  'TASK-AUTHOR': {
    max: 2,
    note: 'briefs must not conflict; three is too many to keep straight',
  },
  'WORKER-MONITOR': {
    max: 1,
    note: 'the job is holding the whole picture; two means two agents messaging one worker',
  },
  'DATA-STEWARD': {
    max: 1,
    note: 'takes the seeds lock; a second instance waits rather than works',
  },
  'QA-GATE-TESTER': {
    max: 1,
    note: 'fixtures collide on the same files',
  },
  IMPLEMENTATION: {
    max: 1,
    note: 'the only role that writes application code',
  },
};

export const ROLE_FILES = Object.keys(CAPACITY).map((r) => `${r}.md`);