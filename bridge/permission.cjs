// Permission details are ephemeral, local, and sent only for a real request.
// Never truncate an action and then offer to authorize the unseen remainder.
function permission(raw){
 if(raw?.hook_event_name!=='PermissionRequest'||typeof raw.session_id!=='string'||typeof raw.tool_name!=='string'||!raw.tool_input||typeof raw.tool_input!=='object'||Array.isArray(raw.tool_input))return null;
 const value={tool_input:raw.tool_input,cwd:raw.cwd||'',permission_mode:raw.permission_mode||''};
 const encoded=JSON.stringify(value);if(Buffer.byteLength(encoded)>5000||/[\u202a-\u202e\u2066-\u2069]/.test(encoded))return null;
 return value;
}
module.exports={permission};
