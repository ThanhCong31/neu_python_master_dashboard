import { Select } from '@/components/expressive/select';
import './data-workspace.css';

/** Uses the existing Expressive exposed dropdown. Only use outside native modal dialogs. */
export function WorkspaceSelect<T extends string>({ label, value, options, onChange, disabled }: {
  label: string; value: T; options: readonly {value:T;label:string}[]; onChange:(value:T)=>void; disabled?:boolean;
}) {
  return <Select<T> className="dw-select" label={label} labelPlacement="above" variant="compact" motion="standard"
    value={value} items={[...options]} disabled={disabled} onValueChange={next=>{
      const item=options.find(o=>o.value===next);
      if(item && item.value!==value) onChange(item.value);
    }}/>;
}
