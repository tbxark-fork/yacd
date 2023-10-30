import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import * as React from 'react';
import {
  fetchRuleProviders,
  refreshRuleProviderByName,
  updateRuleProviders,
} from 'src/api/rule-provider';
import { fetchRules } from 'src/api/rules';
import { ruleFilterTextAtom } from 'src/store/rules';
import type { ClashAPIConfig } from 'src/types';

const { useCallback } = React;

export function useUpdateRuleProviderItem(
  name: string,
  apiConfig: ClashAPIConfig,
): [(ev: React.MouseEvent<HTMLButtonElement>) => unknown, boolean] {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: refreshRuleProviderByName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/providers/rules'] });
    },
  });
  const onClickRefreshButton = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    mutate({ name, apiConfig });
  };
  return [onClickRefreshButton, isPending];
}

export function useUpdateAllRuleProviderItems(
  apiConfig: ClashAPIConfig,
): [(ev: React.MouseEvent<HTMLButtonElement>) => unknown, boolean] {
  const queryClient = useQueryClient();
  const { data: provider } = useRuleProviderQuery(apiConfig);
  const { mutate, isPending } = useMutation({
    mutationFn: updateRuleProviders,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/providers/rules'] });
    },
  });
  const onClickRefreshButton = (ev: React.MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault();
    mutate({ names: provider.names, apiConfig });
  };
  return [onClickRefreshButton, isPending];
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/rules'] });
    queryClient.invalidateQueries({ queryKey: ['/providers/rules'] });
  }, [queryClient]);
}

export function useRuleProviderQuery(apiConfig: ClashAPIConfig) {
  return useQuery({ queryKey: ['/providers/rules', apiConfig], queryFn: fetchRuleProviders });
}

export function useRuleAndProvider(apiConfig: ClashAPIConfig) {
  const { data: rules, isFetching } = useQuery({
    queryKey: ['/rules', apiConfig],
    queryFn: fetchRules,
  });
  const { data: provider } = useRuleProviderQuery(apiConfig);
  const [filterText] = useAtom(ruleFilterTextAtom);
  if (filterText === '') {
    return { rules, provider, isFetching };
  } else {
    const f = filterText.toLowerCase();
    return {
      rules: rules.filter((r) => r.payload.toLowerCase().indexOf(f) >= 0),
      isFetching,
      provider: {
        byName: provider.byName,
        names: provider.names.filter((t) => t.toLowerCase().indexOf(f) >= 0),
      },
    };
  }
}
