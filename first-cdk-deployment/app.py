#!/usr/bin/env python3
import os
import aws_cdk as cdk
from first_cdk_deployment.first_cdk_deployment_stack import WebsiteStack

app = cdk.App()
WebsiteStack(app, "WebsiteStack")
app.synth()
