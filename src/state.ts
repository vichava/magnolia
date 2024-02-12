export type StateListener<T> = (value: T, old_value: T) => void;
export type EqualityFunction<T> = (a: T, b: T) => boolean;

/**
 * Creates a new State object with the specified value.
 *
 * @template T value - The value of the State object.
 * @param {T} value - The value of the State object.
 * @param {EqualityFunction} equals - An optional equality function to use when comparing the value.
 *
 * @returns {State<T>} - A new State object with the specified value.
 */
export function state<T>(
    value: T,
    equals?: EqualityFunction<T>
): State<T> {
    return new State(value, equals);
}

/**
 * Creates a new mapped state by applying a mapping function to the value of an existing state.
 *
 * @param {State} state - The existing state to map
 * @param fn - The mapping function to apply to the value of the state
 * @param equals - An optional equality function to use when comparing the mapped value
 * @returns {State} A new state with the mapped value
 */
export function map<M, T>(
    state: State<T>,
    fn: (value: T) => M,
    equals?: EqualityFunction<M>
): State<M> {
    return new MappedState(state, fn, equals);
}

/**
 * Represents a state object that holds a value and allows for listening and updating the value.
 * @template T - The type of value held by the state object.
 */
export class State<T> {

    protected equals: EqualityFunction<T> | undefined = undefined;
    private value: T;
    private listeners: Set<StateListener<T>> = new Set();

    constructor(
        value: T,
        equals?: EqualityFunction<T>
    ) {
        this.value = value;
        this.equals = equals;
    }

    /**
     * Retrieves the value of the current object.
     *
     * @return The value of the current object
     */
    public get(): T {
        return this.value;
    }

    /**
     * Sets the value of the object.
     *
     * @param value - The value to be set
     * @return {void}
     */
    public set(value: T): void {
        let updated: boolean = this.equals === undefined ? true : !this.equals(this.value, value);

        if (!updated) {
            return;
        }

        const old_value: T = this.value;
        this.value = value;

        for (let listener of this.listeners) {
            listener(this.value, old_value);
        }
    }

    /**
     * Adds a StateListener to the listeners set and returns a function to remove it.
     *
     * @param {StateListener} listener - The listener to bind
     * @returns {Function} - A function that, when called, removes the listener from the listeners set
     */
    public bind(listener: StateListener<T>): () => void {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        }
    }

    public map<M>(fn: (value: T) => M): MappedState<M, T> {
        return new MappedState(this, fn);
    }

}

/**
 * Represents a mapped state that transforms the value of the source state using a provided function.
 *
 * @template M The type of the mapped state value
 * @template T The type of the source state value
 */
export class MappedState<M, T> extends State<M> {

    private unbind_fn: (() => void) | undefined;

    constructor(
        state: State<T>,
        fn: (value: T) => M,
        equals?: EqualityFunction<M>
    ) {
        super(fn(state.get()));

        this.unbind_fn = state.bind((value: T): void => {
            this.set(fn(value));
        });

        this.equals = equals;
    }

    /**
     * Unbinds the mapped state from the source state.
     *
     * @returns {void}
     */
    public unbind(): void {
        if (this.unbind_fn === undefined) {
            return;
        }

        this.unbind_fn();
        this.unbind_fn = undefined;
    }

}
