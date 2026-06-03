import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { cluster } from "../cluster"
import { appLoadBalancer } from "../load-balance"
import { amqpListener } from "./rabbitmq"
import { invoicesDockerImage } from "../images/invoices";

const invoicesTargetGroup = appLoadBalancer.createTargetGroup('invoices-target', {
  port: 3334,
  protocol: 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP'
  }
})
export const invoicesHttpListener = appLoadBalancer.createListener('invoices-listener', {
  port: 3334,
  protocol: 'HTTP',
  targetGroup: invoicesTargetGroup
})

export const invoicesService = new awsx.classic.ecs.FargateService('fargate-invoices', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: invoicesDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [invoicesHttpListener],
      environment: [
        {
          name: 'BROKER_URL',
          value: pulumi.interpolate`amqp://${amqpListener.endpoint.hostname}:${amqpListener.endpoint.port}`
        },
        {
          name: 'DATABASE_URL',
          value: ''
        },
        {
          name: 'OTEL_TRACES_EXPORTER',
          value: 'otlp'
        },
        {
          name: 'OTEL_SERVICE_NAME',
          value: 'invoices'
        },
        {
          name: 'OTEL_NODE_ENABLED_INSTRUMENTATIONS',
          value: 'http,fastify,pg,amqplib'
        },
        {
          name: 'OTEL_EXPORTER_OTLP_ENDPOINT',
          value: ''
        },
        {
          name: 'OTEL_EXPORTER_OTLP_HEADERS',
          value: ''
        },
      ]
    }
  }
})