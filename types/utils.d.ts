export type Fn<T = any, P = any> = {
	[key: string]: (...args: T[]) => P
}

export type ObjReturnType<T extends Fn> = { [K in keyof T]: ReturnType<T[K]> }

export type GetFieldType<
	Obj,
	Path,
	Default = undefined
> = Path extends `${infer Left}.${infer Right}`
	? Left extends keyof Obj
		?
				| GetFieldType<Exclude<Obj[Left], undefined>, Right, Default>
				| Extract<Obj[Left], undefined>
		: Default
	: Path extends keyof Obj
	? Obj[Path]
	: Default
