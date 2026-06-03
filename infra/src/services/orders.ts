import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";

import { cluster } from "../cluster"
import { appLoadBalancer } from "../load-balance"
import { amqpListener } from "./rabbitmq"
import { ordersDockerImage } from "../images/orders";

const ordersTargetGroup = appLoadBalancer.createTargetGroup('orders-target', {
  port: 3333,
  protocol: 'HTTP',
  healthCheck: {
    path: '/health',
    protocol: 'HTTP'
  }
})
export const ordersHttpListener = appLoadBalancer.createListener('orders-listener', {
  port: 3333,
  protocol: 'HTTP',
  targetGroup: ordersTargetGroup
})

export const ordersService = new awsx.classic.ecs.FargateService('fargate-orders', {
  cluster,
  desiredCount: 1,
  waitForSteadyState: false,
  taskDefinitionArgs: {
    container: {
      image: ordersDockerImage.ref,
      cpu: 256,
      memory: 512,
      portMappings: [ordersHttpListener],
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
          value: 'orders'
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