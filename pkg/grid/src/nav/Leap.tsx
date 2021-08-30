import classNames from 'classnames';
import { debounce } from 'lodash-es';
import React, {
  ChangeEvent,
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  HTMLAttributes,
  useCallback,
  useImperativeHandle,
  useRef
} from 'react';
import { Link, useHistory, useRouteMatch } from 'react-router-dom';
import { Cross } from '../components/icons/Cross';
import { MenuState, useLeapStore } from './Nav';

function normalizePathEnding(path: string) {
  const end = path.length - 1;
  return path[end] === '/' ? path.substring(0, end - 1) : path;
}

export function createPreviousPath(current: string): string {
  const parts = normalizePathEnding(current).split('/');
  parts.pop();

  if (parts[parts.length - 1] === 'leap') {
    parts.push('search');
  }

  return parts.join('/');
}

type LeapProps = {
  menu: MenuState;
  dropdown: string;
  navOpen: boolean;
} & HTMLAttributes<HTMLDivElement>;

export const Leap = React.forwardRef(({ menu, dropdown, navOpen, className }: LeapProps, ref) => {
  const { push } = useHistory();
  const match = useRouteMatch<{ menu?: MenuState; query?: string; desk?: string }>(
    `/leap/${menu}/:query?/(apps)?/:desk?`
  );
  const appsMatch = useRouteMatch(`/leap/${menu}/${match?.params.query}/apps`);
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current);
  const { rawInput, selectedMatch, matches, selection, select } = useLeapStore();

  const toggleSearch = useCallback(() => {
    if (selection || menu === 'search') {
      return;
    }

    push('/leap/search');
  }, [selection, menu]);

  const onFocus = useCallback(
    (e: FocusEvent<HTMLInputElement>) => {
      // refocusing tab with input focused is false trigger
      const windowFocus = e.nativeEvent.currentTarget === document.body;
      if (windowFocus) {
        return;
      }

      toggleSearch();
    },
    [toggleSearch]
  );

  const getMatch = useCallback(
    (value: string) => {
      const normValue = value.toLocaleLowerCase();
      return matches.find(
        (m) =>
          m.display?.toLocaleLowerCase().startsWith(normValue) ||
          m.value.toLocaleLowerCase().startsWith(normValue)
      );
    },
    [matches]
  );

  const navigateByInput = useCallback(
    (input: string) => {
      const normalizedValue = input.trim().replace(/(~?[\w^_-]{3,13})\//, '$1/apps/');
      push(`/leap/${menu}/${normalizedValue}`);
    },
    [menu]
  );

  const handleSearch = useCallback(
    debounce(
      (input: string) => {
        if (!match || appsMatch) {
          return;
        }

        useLeapStore.setState({ searchInput: input });
        navigateByInput(input);
      },
      300,
      { leading: true }
    ),
    [menu, match]
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      const value = input.value.trim();
      const isDeletion = (e.nativeEvent as InputEvent).inputType === 'deleteContentBackward';
      const inputMatch = getMatch(value);
      const matchValue = inputMatch?.display || inputMatch?.value;

      if (matchValue && inputRef.current && !isDeletion) {
        inputRef.current.value = matchValue;
        inputRef.current.setSelectionRange(value.length, matchValue.length);
        useLeapStore.setState({
          rawInput: matchValue,
          selectedMatch: inputMatch
        });
      } else {
        useLeapStore.setState({
          rawInput: value,
          selectedMatch: matches[0]
        });
      }

      handleSearch(value);
    },
    [matches]
  );

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (selectedMatch?.href) {
        window.open(selectedMatch.href, selectedMatch.value);
        return;
      }

      if (!selectedMatch?.value) {
        return;
      }

      // TODO: evaluate if we still need this for manual entry
      // const value = inputRef.current?.value.trim();

      // if (!value) {
      //   return;
      // }

      // const input = [getMatch(value)?.value || slugify(value)];

      const input = [selectedMatch.value];
      if (appsMatch) {
        input.unshift(match?.params.query || '');
      } else {
        input.push('');
      }

      navigateByInput(input.join('/'));
      useLeapStore.setState({ rawInput: '' });
    },
    [match, selectedMatch]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const deletion = e.key === 'Backspace' || e.key === 'Delete';
      const arrow = e.key === 'ArrowDown' || e.key === 'ArrowUp';

      if (deletion && !rawInput && selection) {
        e.preventDefault();
        select(null, appsMatch && !appsMatch.isExact ? undefined : match?.params.query);
        const pathBack = createPreviousPath(match?.url || '');
        push(pathBack);
      }

      if (arrow) {
        e.preventDefault();

        const currentIndex = selectedMatch
          ? matches.findIndex((m) => {
              const matchValue = m.display || m.value;
              const searchValue = selectedMatch.display || selectedMatch.value;
              return matchValue === searchValue;
            })
          : 0;
        const unsafeIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
        const index = (unsafeIndex + matches.length) % matches.length;

        const newMatch = matches[index];
        const matchValue = newMatch.display || newMatch.value;
        useLeapStore.setState({
          rawInput: matchValue,
          // searchInput: matchValue,
          selectedMatch: newMatch
        });
      }
    },
    [selection, rawInput, match, matches, selectedMatch]
  );

  return (
    <div className="relative z-50 w-full">
      <form
        className={classNames(
          'flex items-center h-full w-full px-2 rounded-full bg-white default-ring focus-within:ring-2',
          navOpen && menu !== 'search' && 'opacity-80',
          !navOpen ? 'bg-gray-100' : '',
          className
        )}
        onSubmit={onSubmit}
      >
        <label
          htmlFor="leap"
          className={classNames(
            'inline-block flex-none p-2 h4 text-blue-400',
            !selection && 'sr-only'
          )}
        >
          {selection || 'Search Landscape'}
        </label>
        <input
          id="leap"
          type="text"
          ref={inputRef}
          placeholder={selection ? '' : 'Search Landscape'}
          className="flex-1 w-full px-2 h4 rounded-full bg-transparent outline-none"
          value={rawInput}
          onClick={toggleSearch}
          onFocus={onFocus}
          onChange={onChange}
          onKeyDown={onKeyDown}
          aria-autocomplete="both"
          aria-controls={dropdown}
          aria-activedescendant={selectedMatch?.display || selectedMatch?.value}
        />
      </form>
      {navOpen && (
        <Link
          to="/"
          className="absolute top-1/2 right-2 flex-none circle-button w-8 h-8 text-gray-400 bg-gray-100 default-ring -translate-y-1/2"
          onClick={() => select(null)}
        >
          <Cross className="w-3 h-3 fill-current" />
          <span className="sr-only">Close</span>
        </Link>
      )}
    </div>
  );
});
