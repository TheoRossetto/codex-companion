interface Window { orbit: { invoke(command:string,args?:Record<string,unknown>):Promise<unknown>; onEvent(name:string,fn:(payload:any)=>void):()=>void; onDragDrop(fn:(event:any)=>void):()=>void; } }
