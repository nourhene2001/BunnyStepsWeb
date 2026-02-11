pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    stages {
        stage('Clean & Clone') {
            steps {
                cleanWs()
                git url: 'https://github.com/nourhene2001/BunnyStepsWeb.git',
                    branch: 'main',
                    credentialsId: 'gitlab-access-token'  // try your current ID first
                sh '''
                    pwd
                    ls -la
                    tree -L 3   # shows folder structure up to 3 levels deep
                    echo "Is backend there? $(ls backend 2>/dev/null || echo 'NO')"
                    echo "Is requirements.txt there? $(ls backend/BunnySteps/requirements.txt 2>/dev/null || echo 'NO')"
                '''
            }
        }
    }
}
