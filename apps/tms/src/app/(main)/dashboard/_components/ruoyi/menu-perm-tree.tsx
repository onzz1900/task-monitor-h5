"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type MenuTreeItem = {
  menu_id: number;
  menu_name: string;
  menu_type: string;
  perms: string;
  children: MenuTreeItem[];
};

function collectIds(node: MenuTreeItem): number[] {
  return [node.menu_id, ...node.children.flatMap(collectIds)];
}

function MenuNode({
  node,
  selected,
  onChange,
  disabled,
}: {
  node: MenuTreeItem;
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
  disabled?: boolean;
}) {
  const ids = collectIds(node);
  const checkedCount = ids.filter((id) => selected.has(id)).length;
  const checked = checkedCount === ids.length;
  const indeterminate = checkedCount > 0 && !checked;

  function toggle(value: boolean) {
    const next = new Set(selected);
    for (const id of ids) {
      if (value) next.add(id);
      else next.delete(id);
    }
    onChange(next);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 py-0.5 text-sm">
        <Checkbox
          id={`menu-${node.menu_id}`}
          checked={indeterminate ? "indeterminate" : checked}
          disabled={disabled}
          onCheckedChange={(value) => toggle(value === true)}
        />
        <label htmlFor={`menu-${node.menu_id}`} className="flex items-center gap-2">
          <span>{node.menu_name}</span>
          <span className="text-muted-foreground text-xs">
            {node.menu_type}
            {node.perms ? ` ${node.perms}` : ""}
          </span>
        </label>
      </div>
      {node.children.length > 0 ? (
        <div className="border-border border-l pl-4">
          {node.children.map((child) => (
            <MenuNode key={child.menu_id} node={child} selected={selected} onChange={onChange} disabled={disabled} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function MenuPermTree({
  tree,
  selected,
  onSelectedChange,
  disabled,
  className,
}: {
  tree: MenuTreeItem[];
  selected: number[];
  onSelectedChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
}) {
  const set = new Set(selected);
  return (
    <div className={cn("max-h-80 overflow-auto rounded-lg border p-3", className)}>
      {tree.map((node) => (
        <MenuNode
          key={node.menu_id}
          node={node}
          selected={set}
          disabled={disabled}
          onChange={(next) => onSelectedChange([...next])}
        />
      ))}
    </div>
  );
}
