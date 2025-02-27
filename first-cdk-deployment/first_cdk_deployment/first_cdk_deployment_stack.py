from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_s3_deployment as s3deploy,
    aws_iam as iam,
    CfnOutput,
    RemovalPolicy
)
from constructs import Construct

class FirstCdkDeploymentStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create resources
        website_bucket = self._create_website_bucket()
        oac = self._create_origin_access_control()
        distribution = self._create_cloudfront_distribution(website_bucket, oac)
        
        # Add bucket policy after distribution is created
        self._add_bucket_policy(website_bucket, distribution)
        
        # Output CloudFront URL
        self._create_cloudfront_output(distribution)

    def _create_website_bucket(self) -> s3.Bucket:
        """Create and configure S3 bucket for website hosting"""
        return s3.Bucket(
            self, 
            "ShopReactBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

    def _create_origin_access_control(self) -> cloudfront.CfnOriginAccessControl:
        """Create Origin Access Control for CloudFront"""
        return cloudfront.CfnOriginAccessControl(
            self, 
            "OAC",
            origin_access_control_config=cloudfront.CfnOriginAccessControl.OriginAccessControlConfigProperty(
                name="S3OriginAccessControl",
                origin_access_control_origin_type="s3",
                signing_behavior="always",
                signing_protocol="sigv4"
            )
        )

    def _create_cloudfront_distribution(
        self, 
        bucket: s3.Bucket, 
        oac: cloudfront.CfnOriginAccessControl
    ) -> cloudfront.Distribution:
        """Create and configure CloudFront distribution"""
        return cloudfront.Distribution(
            self, 
            "ShopReactDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3BucketOrigin(
                    bucket,
                    origin_access_control_id=oac.ref
                )
            ),
            default_root_object="index.html",  # Added for SPA support
            error_responses=self._get_error_responses()  # Added for SPA support
        )

    def _add_bucket_policy(
        self, 
        bucket: s3.Bucket, 
        distribution: cloudfront.Distribution
    ) -> None:
        """Add bucket policy to allow CloudFront access"""
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject"],
                resources=[bucket.arn_for_objects("*")],
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{Stack.of(self).account}:distribution/{distribution.distribution_id}"
                    }
                }
            )
        )

    def _create_cloudfront_output(self, distribution: cloudfront.Distribution) -> None:
        """Create CloudFront URL output"""
        CfnOutput(
            self, 
            "DistributionDomainName",
            value=distribution.distribution_domain_name,
            description="CloudFront Distribution Domain Name"
        )

    def _get_error_responses(self) -> list[cloudfront.ErrorResponse]:
        """Configure error responses for SPA support"""
        return [
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
