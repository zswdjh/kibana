/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import uuid from 'uuid';
import { schema } from '@kbn/config-schema';
import { PluginSetupContract } from '../../../../../alerting/server';
import { createMetricThresholdExecutor, FIRED_ACTIONS } from './metric_threshold_executor';
import { METRIC_THRESHOLD_ALERT_TYPE_ID } from './types';

export async function registerMetricThresholdAlertType(alertingPlugin: PluginSetupContract) {
  if (!alertingPlugin) {
    throw new Error(
      'Cannot register metric threshold alert type.  Both the actions and alerting plugins need to be enabled.'
    );
  }
  const alertUUID = uuid.v4();

  const baseCriterion = {
    threshold: schema.arrayOf(schema.number()),
    comparator: schema.oneOf([
      schema.literal('>'),
      schema.literal('<'),
      schema.literal('>='),
      schema.literal('<='),
      schema.literal('between'),
    ]),
    timeUnit: schema.string(),
    timeSize: schema.number(),
    indexPattern: schema.string(),
  };

  const nonCountCriterion = schema.object({
    ...baseCriterion,
    metric: schema.string(),
    aggType: schema.oneOf([
      schema.literal('avg'),
      schema.literal('min'),
      schema.literal('max'),
      schema.literal('rate'),
      schema.literal('cardinality'),
    ]),
  });

  const countCriterion = schema.object({
    ...baseCriterion,
    aggType: schema.literal('count'),
    metric: schema.never(),
  });

  alertingPlugin.registerType({
    id: METRIC_THRESHOLD_ALERT_TYPE_ID,
    name: 'Metric Alert - Threshold',
    validate: {
      params: schema.object({
        criteria: schema.arrayOf(schema.oneOf([countCriterion, nonCountCriterion])),
        groupBy: schema.maybe(schema.string()),
        filterQuery: schema.maybe(schema.string()),
      }),
    },
    defaultActionGroupId: FIRED_ACTIONS.id,
    actionGroups: [FIRED_ACTIONS],
    executor: createMetricThresholdExecutor(alertUUID),
  });
}
