from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3_deployment as s3deploy,
    CfnOutput,
    RemovalPolicy
)
from constructs import Construct

class WebsiteStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create an S3 bucket to host the website
        website_bucket = s3.Bucket(
            self, 
            "WebsiteBucket",
            removal_policy=RemovalPolicy.DESTROY,  # NOT recommended for production
            auto_delete_objects=True,             # NOT recommended for production
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )

        # Create Origin Access Identity for CloudFront
        origin_access_identity = cloudfront.OriginAccessIdentity(
            self, 
            "OriginAccessIdentity",
            comment="CloudFront access to S3"
        )

        # Grant read permissions for CloudFront
        website_bucket.grant_read(origin_access_identity)

        # Create CloudFront Distribution
        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    website_bucket,
                    origin_access_identity=origin_access_identity
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            default_root_object="index.html",
            error_responses=[
                cloudfront.ErrorResponse(
                    http_status=403,
                    response_http_status=200,
                    response_page_path="/index.html"
                ),
                cloudfront.ErrorResponse(
                    http_status=404,
                    response_http_status=200,
                    response_page_path="/index.html"
                )
            ]
        )

        # Deploy site contents to S3 bucket
        s3deploy.BucketDeployment(
            self,
            "DeployWebsite",
            sources=[s3deploy.Source.asset("../dist")],  # Adjust this path
            destination_bucket=website_bucket,
            distribution=distribution,
            distribution_paths=["/*"]
        )

        # Output the CloudFront URL
        CfnOutput(
            self,
            "CloudFrontURL",
            value=f"https://{distribution.distribution_domain_name}",
            description="Website URL"
        )


