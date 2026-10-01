// Adapted from Coucou's windows/src/island/hooks.ts and core/state.ts (MIT).
// Copyright (c) 2026 Louis Raillé. Codex multi-session port: TheoRossetto.
const { metadata } = require('../bridge/protocol.cjs');
class Sessions {
  constructor() { this.items = new Map(); this.lastEvent = null; }
  accept(raw, now = Date.now()) {
    const event = metadata(raw);
    if (!event) return false;
    const id = event.session_id;
    const item = this.items.get(id) || { id, project: event.project, state: 'idle', steps: [], updatedAt: now };
    item.project = event.project || item.project;
    item.updatedAt = now;
    const tool = event.tool_name || 'Ferramenta';
    const transitions = {
      SessionStart: ['idle', 'Sessão conectada'], UserPromptSubmit: ['thinking', 'Preparando resposta'],
      PreToolUse: ['working', tool], PostToolUse: ['working', `${tool} terminou`],
      PermissionRequest: ['approval', 'Verifique o pedido no Codex'],
      Stop: ['finished', 'Turno concluído'], Interrupt: ['interrupted', 'Turno interrompido'],
      SessionEnd: ['ended', 'Sessão encerrada'],
    };
    const transition = transitions[event.hook_event_name];
    if (transition) { item.state = transition[0]; item.steps.push(transition[1]); }
    if (event.hook_event_name === 'SubagentStart') item.steps.push('Subagente iniciado');
    if (event.hook_event_name === 'SubagentStop') item.steps.push('Subagente terminou');
    item.steps = item.steps.slice(-20);
    this.items.delete(id);
    this.items.set(id, item);
    while (this.items.size > 40) this.items.delete(this.items.keys().next().value);
    this.lastEvent = now;
    return true;
  }
  snapshot(now = Date.now()) {
    return [...this.items.values()].reverse().filter(item => now - item.updatedAt < 24 * 60 * 60 * 1000).map(item => ({
      ...item, steps: [...item.steps],
      // PermissionRequest is advisory: the IDE or another hook may have resolved it.
      state: item.state === 'approval' && now - item.updatedAt > 120000 ? 'unknown'
        : ['working', 'thinking'].includes(item.state) && now - item.updatedAt > 300000 ? 'unknown' : item.state,
    }));
  }
  clear() { this.items.clear(); }
}
module.exports = { Sessions };
