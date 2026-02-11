pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main'
            }
        }

        stage('Backend: Install & Test') {
            agent {
                docker {
                    image 'bunny-ci:python-node'
                }
            }
            steps {
                sh '''
                    echo "=== Listing test files ==="
                    ls -R BunnySteps/Tests
                    
                    # Make sure Django env is ready
                    export DJANGO_SETTINGS_MODULE=BunnySteps.settings
                    python manage.py migrate
                    
                    mkdir -p test-reports
                    
                    pytest BunnySteps/Tests \
                        --tb=short \
                        --html=test-reports/report.html \
                        --self-contained-html \
                        --metadata "Project" "BunnyStepsWeb" \
                        --metadata "Build" "$BUILD_NUMBER" \
                        --metadata "Branch" "$BRANCH_NAME" \
                        --junitxml=test-reports/results.xml
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend/test-reports/report.html', fingerprint: true
                    junit allowEmptyResults: true, testResults: 'backend/test-reports/results.xml'
                }
            }
        }
    }

    post {
        success { echo 'Pipeline succeeded! 🎉' }
        failure { echo 'Pipeline failed – check logs.' }
        always  { cleanWs() }
    }
}
