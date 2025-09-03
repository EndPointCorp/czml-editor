export type callBack<T> = (data: T, ...rest: any[]) => any;

export type cb2args<A, B> = (a: A, b: B, ...rest: any[]) => any;

export class Event<T> {

    subs: callBack<T>[] = []
    
    subscribe(cb: callBack<T>) {
        this.subs.push(cb);
    }

    emit(data: T, ...rest: any[]) {
        this.subs.forEach(s => s(data, ...rest));
    }

    unSubscribe(cb: callBack<T>) {
        this.subs = this.subs.filter(c => c !== cb);
    }

}

export class FuncDelegate {
    delegate?: (...args: any[]) => any = undefined

    assign(delegate: (...args: any[]) => any) {
        this.delegate = delegate;
    }

    call(...args: any[]) {
        if (!this.delegate) {
            return undefined;
        }
        
        return this.delegate(...args);
    }
}

type Str2Callback<T> = {
    [key: string]: T
}

type Comparator = (a: any, b: any) => boolean;

export class Signal<V, C> {
    get value() {
        return this._value;
    };

    _value: V;

    _comparator?: Comparator;
    
    _subs: Str2Callback<cb2args<V, C>> = {};

    constructor(val: V, comparator?: Comparator) {
        this._value = val;
        this._comparator = comparator;
    }

    setValue(val: V, context: C, ...rest: any[]) {
        const equals = this._comparator === undefined ? 
            this._value === val : this._comparator(this._value, val);

        if (equals) {
            return;
        }

        this._value = val;
        Object.values(this._subs).forEach(
            (s: unknown) => (s as cb2args<V, C>)(this._value, context, ...rest)
        );
    }

    subscribe(cb: cb2args<V, C>, key?: string) {
        const subKey = key !== undefined ? key : `${this._subs.length}`;
        this._subs[subKey] = cb;
    }

    unSubscribe(key: string) {
        delete this._subs[key];
    }
}